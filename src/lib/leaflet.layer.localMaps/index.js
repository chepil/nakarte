import L from 'leaflet';
// import * as logging from '~/lib/logging';
import {layersControl} from "../../App";

var myImageOverlays = [];

function getHostName() {
  var host = window.location.host;
  let hp = host.split(":");
  var brokerhost = host;
  if (hp.length === 2) {
    brokerhost = hp[0];
  }
  return brokerhost;
}

function getHostForLocalMaps() {
  let host = window.location.host;
  return host;
}

let apiHost = getHostName();
let localMapsHost = getHostForLocalMaps(); // getHostWithPost();

function parseKmzMapData(map, mapname, data) {
  let cnt = myImageOverlays.filter((overlayObj) => overlayObj.name === mapname).length;
  if (cnt === 0) {
    var mapImageOverlays = [];
    data.forEach(function(entry) {
      let file = entry['file'];
      let north = entry['north'];
      let south = entry['south'];
      let east = entry['east'];
      let west = entry['west'];
      let imageUrl = "http://" + localMapsHost + "/maps/kmz/" + mapname + "/" + file;
      let imageBounds = [[north, east], [south, west]];
      let i = L.imageOverlay(imageUrl, imageBounds);
      mapImageOverlays.push(i);
    });

    let overlay = L.layerGroup(mapImageOverlays);
    overlay.isOverlay = false;
    let overlayObj = {
      name: mapname,
      overlay: overlay
    };
    myImageOverlays.push(overlayObj);
    layersControl.addOverlay(overlay, mapname);
  }
}

function loadLocalKmzMaps(map) {
  let url = "http://" + apiHost + "/myapi/localmaps/kmz";
  fetch(url)
    .then((res) => res.json())
    .then((items) => {
      for (const item of items) {
        let mapname = item['name'];
        let data = item['data'];
        parseKmzMapData(map, mapname, data);
    }
  });
}

L.LocalMaps = L.GridLayer.extend({
        options: {},
        initialize: function(options) {
            L.GridLayer.prototype.initialize.call(this, options);
        },
        onAdd: function(map) {
          // logging.captureMessage("onAdd");
          L.GridLayer.prototype.onAdd.call(this, map);
          map.on('mousemove', this.onMouseMove, this);
          map.on('zoomend', this.onZoomEnd, this);
          map.on('zoomstart', this.onZoomStart, this);
          loadLocalKmzMaps(map);
        },
        onRemove: function(map) {
          // logging.captureMessage("onRemove");
          map.off('mousemove', this.onMouseMove, this);
          L.TileLayer.prototype.onRemove.call(this, map);
          map.off('zoomend', this.onZoomEnd, this);
          map.off('zoomstart', this.onZoomStart, this);

          if (myImageOverlays.length > 0) {
            setTimeout(() => {
              myImageOverlays.forEach((overlayObj) => {
                let layer = overlayObj.overlay;
                map.removeLayer(layer);
              });
              myImageOverlays.forEach((overlayObj) => {
                let layer = overlayObj.overlay;
                layersControl.removeLayer(layer);
              });
              while (myImageOverlays.length > 0) {
                myImageOverlays.pop();
              }
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
        },
    }
);
