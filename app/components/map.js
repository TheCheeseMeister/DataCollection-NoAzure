"use client";

import { useEffect, useRef, useState } from "react";

import Map from "ol/Map";
import View from "ol/View";

import TileLayer from "ol/layer/Tile";
import { Vector, XYZ } from "ol/source";
import OSM from "ol/source/OSM";

import "ol/ol.css";

import { getCollectionMapData } from "../utils/supabase/collection-queries";
import { Feature } from "ol";
import { Point } from "ol/geom";
import { fromLonLat } from "ol/proj";
import Style from "ol/style/Style";
import Fill from "ol/style/Fill";
import VectorSource from "ol/source/Vector";
import VectorLayer from "ol/layer/Vector";
import CircleStyle from "ol/style/Circle";
import Overlay from 'ol/Overlay';

import { boundingExtent } from "ol/extent";

export default function OpenLayersMap() {
    const [collectionData, setCollectionData] = useState([]);
    const [selectedFeature, setSelectedFeature] = useState(null);

    const [markerColorMode, setMarkerColorMode] = useState("Collected");
    const [route, setRoute] = useState("");
    const [direction, setDirection] = useState("");
    const [mpFrom, setMpFrom] = useState("");
    const [mpTo, setMpTo] = useState("");

    const mapRef = useRef(null);
    const popupRef = useRef(null);

    const mapInstance = useRef(null);
    const markerSource = useRef(null);
    const markersRef = useRef([]);

    const satelliteLayerRef = useRef(null);
    const streetLayerRef = useRef(null);

    const lineLayerRef = useRef(null);
    const [lineMode, setLineMode] = useState("");

    const [markerRadius, setMarkerRadius] = useState(2);

    const overlayRef = useRef(null);

    function searchRoute(route, direction, mpFrom, mpTo) {
        let loc1 = null;
        let loc2 = null;
        let inbetween = [];

        const start = Number(mpFrom);
        const end = Number(mpTo);

        markersRef.current.forEach((f) => {
            const markerRoute = f.get("Route");
            const markerDir = f.get("Direction");
            const markerFrom = Number(f.get("MPFrom"));
            const markerTo = Number(f.get("MPTo"));

            if (
                markerRoute === route &&
                markerDir === direction
            ) {
                if (
                    markerTo >= start &&
                    markerFrom <= end
                ) {
                    inbetween.push(f);
                }

                if (
                    !loc1 ||
                    Math.abs(markerFrom - start) <
                    Math.abs(Number(loc1.get("MPFrom")) - start)
                ) {
                    loc1 = f;
                }

                if (
                    !loc2 ||
                    Math.abs(markerTo - end) <
                    Math.abs(Number(loc2.get("MPTo")) - end)
                ) {
                    loc2 = f;
                }
            }
        });

        if (!loc1 || !loc2 || inbetween.length === 0) {
            alert("Location does not exist");
            return;
        }

        markersRef.current.forEach((f) => {
            const style = f.getStyle();

            if (inbetween.includes(f)) {
                style.getImage().setOpacity(1);
            } else {
                style.getImage().setOpacity(0.01);
            }

            f.setStyle(style);
        });

        const extent = boundingExtent([
            loc1.getGeometry().getCoordinates(),
            loc2.getGeometry().getCoordinates()
        ]);

        mapInstance.current.getView().fit(extent, {
            padding: [50, 50, 50, 50]
        });
    }

    useEffect(() => {
        async function loadData() {
            const data = await getCollectionMapData();
            setCollectionData(data);
        }

        loadData();
    }, []);

    useEffect(() => {
        const markers = [];

        if (!mapRef.current || collectionData.length === 0) return;

        const overlay = new Overlay({
            element: popupRef.current,
        });

        overlayRef.current = overlay;

        for (const item of collectionData) {
            let marker = new Feature({
                geometry: new Point(fromLonLat([item.Longitude, item.Latitude])),
                name: `Route: ${item.Rte}\nDirection: ${item.Dir}\nMPFrom: ${item.MPFrom}\nMPTo: ${item.MPTo}`,
                Route: item.Rte,
                Direction: item.Dir,
                MPFrom: item.MPFrom,
                MPTo: item.MPTo,
                Collected: item.Collected,
                CollectionDate: item.CollectionDate,
                PaveType: item.PaveType,
                IRI: item.IRI,
                Rut: item.Rut,
                SDI: item.SDI
            });

            marker.setStyle(
                new Style({
                    image: new CircleStyle({
                        radius: 2,
                        fill: new Fill({
                            color: item.Collected === "Y"
                                ? "rgb(0, 200, 0)"
                                : "rgb(220, 0, 0)"
                        })
                    })
                })
            );
            markers.push(marker);
        }

        const vectorSource = new VectorSource({ features: markers });
        const markerVectorLayer = new VectorLayer({ source: vectorSource });

        const satelliteLayer = new TileLayer({
            source: new XYZ({
                url: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                attributions: "Tiles © Esri",
            }),
        });

        const streetLayer = new TileLayer({
            source: new XYZ({
                url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
                attributions: "© OpenStreetMap contributors"
            }),
        });

        const labelsLayer = new TileLayer({
            source: new XYZ({
                url: "https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}",
                attributions: "Labels © Esri"
            }),
        });

        satelliteLayerRef.current = satelliteLayer;
        streetLayerRef.current = streetLayer;

        satelliteLayer.setVisible(true);
        streetLayer.setVisible(false);

        const map = new Map({
            target: mapRef.current,
            layers: [satelliteLayer, streetLayer, labelsLayer, markerVectorLayer],
            overlays: [overlay],
            view: new View({
                center: [-8300000, 4950000],
                zoom: 8,
            }),
        });

        map.on("singleclick", (evt) => {

            const feature = map.forEachFeatureAtPixel(
                evt.pixel,
                f => f
            );


            if (feature) {
                setSelectedFeature(feature);

                markersRef.current.forEach((marker) => {
                    const style = marker.getStyle();

                    if (marker.get("Route") === feature.get("Route")) {
                        style.getImage().setOpacity(1);
                    } else {
                        style.getImage().setOpacity(0.01);
                    }

                    marker.setStyle(style);
                });

                overlay.setPosition(
                    evt.coordinate
                );

                map.getView().animate({
                    center: feature.getGeometry().getCoordinates(),
                    duration: 500,
                });
            } else {
                setSelectedFeature(null);
                overlay.setPosition(undefined);

                markersRef.current.forEach((marker) => {
                    const style = marker.getStyle();
                    style.getImage().setOpacity(1);
                    marker.setStyle(style);
                });
            }

        });

        markerSource.current = vectorSource;
        markersRef.current = markers;
        mapInstance.current = map;

        return () => map.setTarget(undefined);
    }, [collectionData]);

    useEffect(() => {
        if (!markersRef.current.length) return;

        markersRef.current.forEach((marker) => {
            const style = marker.getStyle();

            if (markerColorMode === "Collected") {
                style.getImage().getFill().setColor(
                    marker.get("Collected") === "Y"
                        ? "rgb(0, 200, 0)"
                        : "rgb(220, 0, 0)"
                );
            } else if (markerColorMode === "Change Color") {
                style.getImage().getFill().setColor("white");
            }

            marker.changed();
        });
    }, [markerColorMode]);

    useEffect(() => {
        markersRef.current.forEach((marker) => {
            const style = marker.getStyle();

            style.getImage().setRadius(markerRadius);

            marker.changed();
        });
    }, [markerRadius]);

    return (
        <div className="relative text-black">
            <div
                ref={mapRef}
                style={{
                    width: "800px",
                    height: "800px",
                }}
            />

            <div className="absolute top-0 left-8 z-10 rounded shadow-md p-2 w-fit bg-transparent space-y-2">
                {/* Top row */}
                <div className="flex items-center gap-2">
                    <select
                        className="w-20 bg-white p-1 rounded"
                        onChange={(e) => {
                            const value = e.target.value;

                            if (value === "Satellite") {
                                satelliteLayerRef.current.setVisible(true);
                                streetLayerRef.current.setVisible(false);
                            } else {
                                satelliteLayerRef.current.setVisible(false);
                                streetLayerRef.current.setVisible(true);
                            }
                        }}
                    >
                        <option value="Satellite">Satellite</option>
                        <option value="Street">Street</option>
                    </select>

                    <select
                        className="w-32 bg-white p-1 rounded"
                        value={markerColorMode}
                        onChange={(e) => setMarkerColorMode(e.target.value)}
                    >
                        <option value="Collected">Collected</option>
                        <option value="Change Color">Change Color</option>
                    </select>

                    {/* <select className="w-32 bg-white p-1 rounded" value={lineMode}
                        onChange={(e) => setLineMode(e.target.value)}>
                        <option>Show Line</option>
                        <option>Collected</option>
                    </select> */}
                </div>


                {/* Bottom row */}
                <div className="flex items-center gap-2">
                    <input
                        className="h-8 w-16 bg-white p-1 rounded border"
                        placeholder="Route"
                        value={route}
                        onChange={(e) => setRoute(e.target.value)}
                    />
                    <input
                        className="h-8 w-12 bg-white p-1 rounded border"
                        placeholder="Dir"
                        value={direction}
                        onChange={(e) => setDirection(e.target.value)}
                    />
                    <input
                        className="h-8 w-20 bg-white p-1 rounded border"
                        placeholder="MP From"
                        value={mpFrom}
                        onChange={(e) => setMpFrom(e.target.value)}
                    />
                    <input
                        className="h-8 w-20 bg-white p-1 rounded border"
                        placeholder="MP To"
                        value={mpTo}
                        onChange={(e) => setMpTo(e.target.value)}
                    />
                    <button
                        className="bg-blue-600 text-white px-3 py-1 rounded"
                        onClick={() => searchRoute(route, direction, mpFrom, mpTo)}
                    >
                        Search
                    </button>
                </div>

                <div className="flex items-center gap-2 p-1 rounded">
                    <input
                        type="range"
                        min="1"
                        max="10"
                        value={markerRadius}
                        onChange={(e) => {
                            setMarkerRadius(Number(e.target.value));
                        }}
                        className="w-40"
                    />
                </div>
            </div>

            <div
                ref={popupRef}
                style={{
                    background: "white",
                    padding: "10px",
                    borderRadius: "5px",
                    display: selectedFeature ? "block" : "none"
                }}
            >
                {selectedFeature && (
                    <div className="text-black">
                        <button
                            className="float-right bg-red-500 text-white px-2 py-1 rounded"
                            onClick={() => {
                                setSelectedFeature(null);
                                overlayRef.current?.setPosition(undefined);
                            }}
                        >
                            X
                        </button>

                        Route: {selectedFeature.get("Route")}
                        <br />
                        Direction: {selectedFeature.get("Direction")}
                        <br />
                        MP From: {selectedFeature.get("MPFrom")}
                        <br />
                        MP To: {selectedFeature.get("MPTo")}
                        <br />
                        Collected: {selectedFeature.get("Collected")}
                        <br />
                        Collection Date: {selectedFeature.get("CollectionDate")}
                        <br />
                        Pave Type: {selectedFeature.get("PaveType")}
                        <br />
                        IRI: {selectedFeature.get("IRI")}
                        <br />
                        Rut: {selectedFeature.get("Rut")}
                        <br />
                        SDI: {selectedFeature.get("SDI")}
                    </div>
                )}
            </div>
        </div>
    );
}