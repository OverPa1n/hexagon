import {AfterViewInit, Component} from '@angular/core';
import * as L from 'leaflet';
import {LatLngExpression} from 'leaflet';
import hexagonData from '../../assets/data.json';
import proj4 from "proj4";
import * as h3 from "h3-js";

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.scss']
})
export class MapComponent implements AfterViewInit {
  private map: any;
  private drawnItems = new L.FeatureGroup();

  ngAfterViewInit() {
    this.initMap();
    this.loadPolygon();
  }

  private initMap() {
    this.map = L.map('map').setView([25.276987, 55.296249], 5);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    }).addTo(this.map);
  }

  private loadPolygon() {
    const features = this.formatFeatures();
    const coords = features.map((feature: any) => {
      return ({[feature.properties.COLOR_HEX]: this.getPolygonCoords(feature.geometry.cells)})
    });

    this.map.addLayer(this.drawnItems);

    const polygons = this.createPolygons(coords);

    polygons.forEach((polygon: any) => this.drawnItems.addLayer(polygon));

    this.map.fitBounds(this.drawnItems.getBounds());
  }

  private createPolygons(coords: any) {
    return coords.map((item: Record<string, any>) => {
      const [color, coord] = Object.entries(item)[0];

      return L.polygon(coord as LatLngExpression[], {color: `#${color}`});
    });
  }

  private convertToEPSG4326(coord: number[]): [number, number] {
    return proj4('EPSG:3857', 'EPSG:4326', coord) as [number, number];
  }

  private getPolygonCoords(hexagons: any) {
    return hexagons.map((hexagon: any) => {
      return h3.cellsToMultiPolygon([hexagon], false);
    });
  }

  private formatFeatures() {
    return this.featuresArray.map(feature => {
      const flattenedCoords = feature.geometry.coordinates.flat(2);
      const convertedCoords = flattenedCoords.map((ring: any) => {
       return this.convertToEPSG4326(ring);
      });
      const cells = h3.polygonToCells(convertedCoords, 3);

      return {
        ...feature,
        geometry: {
          ...feature.geometry,
          coordinates: convertedCoords,
          cells
        }
      }
    });
  }

  get featuresArray() {
    return hexagonData.features;
  }
}
