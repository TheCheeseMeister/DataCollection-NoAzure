import pdfMake from "pdfmake/build/pdfmake";
import pdfFonts from "pdfmake/build/vfs_fonts";

pdfMake.vfs = pdfFonts.vfs;

export const exportToPDF = (rowData, colDefs, selectedYear, totalRemaining) => {
  colDefs = colDefs.filter(
    (col) => col.field !== "Remove"
  );

  const headerRow = colDefs.map((col) => ({
    text: col.headerName || col.field,
    style: "tableHeader",
  }));

  const bodyRows = rowData.map((row) =>
    colDefs.map((col) => ({
      text: row[col.field] ?? "",
      style: "tableCell",
    }))
  );

  const columnWidths = colDefs.map((col, index) => {
    if (["Route", "Direction", "LaneID"].includes(col.field)) {
      return "auto";
    }

    return "*";
  });

  const exportDate = new Date().toLocaleString();

  const doc = {
    pageOrientation: "portrait",
    pageSize: "LETTER",
    pageMargins: [30, 50, 30, 40],

    header: {
      text: "NJDOT Network Collection Tracker",
      style: "pageHeader",
      margin: [30, 20, 30, 0],
    },

    // Footer with page number
    footer: (currentPage, pageCount) => ({
      columns: [
        {
          text: `Page ${currentPage} of ${pageCount}`,
          alignment: "right",
          margin: [0, 0, 30, 0],
        },
      ],
      style: "footer",
    }),

    content: [
      {
        text: "Network Collection Reruns",
        style: "title",
      },
      {
        columns: [
          {
            text: `Collection Year: ${selectedYear} | Total Remaining Rerun Mileage: ${totalRemaining}`,
            style: "metadata",
          },
          {
            text: `Exported: ${exportDate}`,
            alignment: "right",
            style: "metadata",
          },
        ],
        margin: [0, 0, 0, 15],
      },
      {
        table: {
          headerRows: 1,
          widths: columnWidths,
          body: [headerRow, ...bodyRows],
        },
        layout: {
          fillColor: (rowIndex) => {
            if (rowIndex === 0) {
              return "#2563EB";
            }

            return rowIndex % 2 === 0 ? "#F8FAFC" : "#FFFFFF";
          },

          color: (rowIndex) => {
            return rowIndex === 0 ? "#FFFFFF" : "#1F2937";
          },

          hLineColor: () => "#CBD5E1",
          vLineColor: () => "#CBD5E1",

          hLineWidth: () => 0.5,
          vLineWidth: () => 0.5,

          paddingLeft: () => 4,
          paddingRight: () => 4,
          paddingTop: () => 4,
          paddingBottom: () => 4,
        },
      },
    ],

    styles: {
      title: {
        fontSize: 22,
        bold: true,
        color: "#1E3A8A",
        margin: [0, 0, 0, 8],
      },

      metadata: {
        fontSize: 9,
        color: "#64748B",
      },

      tableHeader: {
        bold: true,
        fontSize: 10,
        color: "#FFFFFF",
        alignment: "left",
      },

      tableCell: {
        fontSize: 9,
        color: "#1F2937",
      },

      pageHeader: {
        fontSize: 9,
        bold: true,
        color: "#64748B",
      },

      footer: {
        fontSize: 8,
        color: "#64748B",
      },
    },

    defaultStyle: {
      fontSize: 9,
    },
  };

  pdfMake.createPdf(doc).download("ag-grid-export.pdf");
};