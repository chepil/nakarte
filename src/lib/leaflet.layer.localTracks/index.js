import L from 'leaflet';
// import * as logging from '~/lib/logging';
import {layersControl} from "../../App";
import parseGpx from "../leaflet.control.track-list/lib/parsers/gpx";
import './style.css';

var myGpxOverlays = [];
function getHostName() {
  var host = window.location.host;
  let hp = host.split(":");
  var brokerhost = host;
  if (hp.length === 2) {
    brokerhost = hp[0];
  }
  return brokerhost;
}

let apiHost = getHostName();

function parseGpxMapFile(map, filename) {
  let cnt = myGpxOverlays.filter((overlayObj) => overlayObj.name === filename).length;
  if (cnt === 0) {
    var mapMarkerOverlays = [];

    var mapOverlays = [];

    var mapPolylineOverlays = [];

    let url = "http://" + apiHost + "/myapi/download/gpx/" + filename;
    fetch(url)
    .then((res) => res.text())
    .then((text) => {
      let result = parseGpx(text, filename, true);
      for (const item of result) {
        item.points.forEach(function(point) {
          let latlng = L.latLng(point.lat, point.lng);
          let divIcon = L.divIcon({
            html: point.name,
            iconSize: [0, 0],
            iconAnchor: [10, 10],
            className: 'gpx_grid_text_position',
          });
          let markerText = L.marker(latlng, {
            icon: divIcon
          });
          mapMarkerOverlays.push(markerText);
          mapOverlays.push(markerText);
        });
        item.tracks.forEach(function(track) {
          let polyline = L.polyline(track, {color: 'red'}); // .addTo(map);
          // zoom the map to the polyline
          // map.fitBounds(polyline.getBounds());
          mapPolylineOverlays.push(polyline);
          mapOverlays.push(polyline);
        });
      }
    })
    .then(() => {
      let overlay = L.layerGroup(mapOverlays);
      overlay.isOverlay = false;
      let overlayObj = {
        name: filename,
        overlay: overlay
      };
      myGpxOverlays.push(overlayObj);
      layersControl.addOverlay(overlay, filename);
    });
  }
}

function loadLocalGpxTracks(map) {
  let url = "http://" + apiHost + "/myapi/localtracks/gpx";
  fetch(url)
    .then((res) => res.json())
    .then((items) => {
      for (const item of items) {
        let filename = item['name'];
        parseGpxMapFile(map, filename);
      }
  });
}

function removeGpxOverlays(map) {
  myGpxOverlays.forEach((overlayObj) => {
    overlayObj.overlay.eachLayer(function(layer) {
      layer.remove(map);
    });
    layersControl.removeLayer(overlayObj.overlay);
    overlayObj.overlay.clearLayers();
  });
  while (myGpxOverlays.length > 0) {
    myGpxOverlays.pop();
  }
}

L.LocalTracks = L.GridLayer.extend({
        options: {},
        initialize: function(options) {
            L.GridLayer.prototype.initialize.call(this, options);
        },
        onAdd: function(map) {
          L.GridLayer.prototype.onAdd.call(this, map);
          map.on('mousemove', this.onMouseMove, this);
          map.on('zoomend', this.onZoomEnd, this);
          map.on('zoomstart', this.onZoomStart, this);
          loadLocalGpxTracks(map);
        },
        onRemove: function(map) {
          map.off('mousemove', this.onMouseMove, this);
          L.TileLayer.prototype.onRemove.call(this, map);
          map.off('zoomend', this.onZoomEnd, this);
          map.off('zoomstart', this.onZoomStart, this);

          if (myGpxOverlays.length > 0) {
            setTimeout(() => {
              removeGpxOverlays(map);
            }, 200);
          }
        },
        onMouseMove: function(e) {
            this.lastMousePos = e.latlng;
        },
        onZoomEnd: function() {
            this.mapZooming = false;
        },
        onZoomStart: function() {
            this.mapZooming = true;
        }
    }
);
