import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

pdfMake.vfs = pdfFonts.vfs;

const getHeaderToExport = (gridApi) => {
    const columns = gridApi.getColumnApi().getAllDisplayedColumns();

    return columns.map((column) => {
        const { field } = column.getColDef();
        const sort = column.getSort();
        const headerNameUppercase =
        field[0].toUpperCase() + field.slice(1);
        const headerCell = {
        text: headerNameUppercase + (sort ? ` (${sort})` : ''),
        };
        return headerCell;
    });
};

const getRowsToExport = (gridApi) => {
    const columns = gridApi.getColumnApi().getAllDisplayedColumns();

    const getCellToExport = (column, node) => ({
        text: gridApi.getValue(column, node) ?? '',
});

const rowsToExport = [];
    gridApi.forEachNodeAfterFilterAndSort((node) => {
        const rowToExport = columns.map((column) =>
        getCellToExport(column, node)
        );
        rowsToExport.push(rowToExport);
    });

    return rowsToExport;
};

const getDocument = (gridApi, columnApi) => {
    const columns = columnApi.getAllDisplayedColumns();

    const headerRow = getHeaderToExport(gridApi);
    const rows = getRowsToExport(gridApi);

    return {
        pageOrientation: 'landscape', // can also be 'portrait'
        content: [
        {
            table: {
            // the number of header rows
            headerRows: 1,

            // the width of each column, can be an array of widths
            widths: `${100 / columns.length}%`,

            // all the rows to display, including the header rows
            body: [headerRow, ...rows],

            // Header row is 40px, other rows are 15px
            heights: (rowIndex) => (rowIndex === 0 ? 40 : 15),
            },
        },
        ],
    };
};

export const exportToPDF = (rowData, colDefs) => {
  const headerRow = colDefs.map((col) => ({
    text: col.headerName || col.field,
  }));

  const bodyRows = rowData.map((row) =>
    colDefs.map((col) => ({
      text: row[col.field] ?? "",
    }))
  );

  const doc = {
    pageOrientation: "landscape",
    content: [
      {
        table: {
          headerRows: 1,
          widths: Array(colDefs.length).fill("*"),
          body: [headerRow, ...bodyRows],
        },
      },
    ],
  };

  pdfMake.createPdf(doc).download();
};