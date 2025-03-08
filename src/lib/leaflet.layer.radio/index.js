import L from 'leaflet';
import './style.css';
// import {openPopupWindow} from '~/lib/popup-window';
import Paho from 'paho-mqtt';
import * as logging from '~/lib/logging';

class RadioPoint {
    constructor(stationId, lat, lng) {
        this.stationId = stationId;
        this.lat = lat;
        this.lng = lng;
    }
}

var arrayOfPoints = [];
var client;
let subscribeto = "gpsloc";

// Load markers
function loadMarkers(map) {
  arrayOfPoints.splice();
  let markers = localStorage.getItem("markers");
  if (markers === null) {
    return;
  }

  markers = JSON.parse(markers);
  // logging.captureMessage('markers ', markers);

  markers.forEach(function(entry) {
    var stationId = "";
    var lat = 0.0;
    var lng = 0.0;
    for (const [key, value] of Object.entries(entry)) {
      // logging.captureMessage(`${key}: ${value}`);
      if (key === "stationId") {
        stationId = value;
      } else if (key === "lat") {
        lat = value;
      } else if (key === "lng") {
        lng = value;
      }
    }
    if (stationId !== "") {
      var j = new RadioPoint(stationId, lat, lng);
      const coord = L.latLng(lat, lng);

      const icon = new L.DivIcon({
        className: 'my-div-icon',
        html: '<span class="radio-tooltip">' + stationId + '</span>'
      });

      arrayOfPoints.push(j);
      const marker = L.marker(
          coord,
          {
            id: stationId,
            icon: icon,
            fillColor: '#00FFFF',
            draggable: false,
            autoClose: false,
            contextmenu: true,
            permanent: true,
          });
      marker.id = stationId;
      marker.options.name = stationId;
      marker.addTo(map).openTooltip();
    }
  });
}
// Store markers
function storeMarker(marker) {
  var markers = localStorage.getItem("markers");
  if (markers === null) {
    markers = [];
    markers.push(marker);
  } else {
    markers = JSON.parse(markers);
    // найти такой маркер. если маркер есть, удалить и запушить новый
    var found = false;
    for (var i = 0; i < markers.length; i++) {
      var m = markers[i];
      if (m.stationId === marker.stationId) {
        found = true;
        markers[i] = marker;
      }
    }
    if (found === false) {
      markers.push(marker);
    }
  }
  localStorage.setItem('markers', JSON.stringify(markers));
}
/*
// Delete Marker
function deleteMarker(lng, lat) {
  var markers = localStorage.getItem("markers");
  markers = JSON.parse(markers);
  for (var i = 0; i < markers.length; i++) {
    let latlng = JSON.parse(markers[i]);
    if (latlng.lat === lat && latlng.lng === lng) {
      markers.splice(i, 1);
    }
  }
  localStorage.setItem('markers', JSON.stringify(markers));
}
*/
function mqtt_init(map) {
    // logging.captureMessage('mqtt_init');
    client = new Paho.Client('192.168.220.8', 9001, "orangepila");
    function onConnect() {
        logging.captureMessage("onConnect");
        client.subscribe(subscribeto);
        // var message = new Paho.Message("onConnect");
        // message.destinationName = "orangepila";
        // client.send(message);
    }

    function onConnectionLost(responseObject) {
        if (responseObject.errorCode !== 0) {
            // logging.captureMessage("onConnectionLost: ", responseObject.errorMessage);
            client.connect({onSuccess: onConnect});
        }
    }
    function onMessageArrived(message) {
        const msgArray = message.payloadString.split(",");
        if (msgArray.length > 6) {
          let stationId = msgArray[1];
          let lat = msgArray[5];
          let lng = msgArray[4];
          var j = new RadioPoint(stationId, lat, lng);
          const index = arrayOfPoints.findIndex((pointItem) => pointItem.stationId === stationId);
          const coord = L.latLng(lat, lng);

          const icon = new L.DivIcon({
            className: 'my-div-icon',
            html: '<span class="radio-tooltip">' + stationId + '</span>'
          });
          let m = {
            stationId: stationId,
            lat: lat,
            lng: lng
          };

          if (index >= 0) {
            arrayOfPoints[index] = j;
            map.eachLayer(function(layer) {
              if (layer.options.id === stationId) {
                layer.setLatLng(coord);
                storeMarker(m);
              }
            });
          } else {
            arrayOfPoints.push(j);
            const marker = L.marker(
                coord,
                {
                  id: stationId,
                  icon: icon,
                  fillColor: '#00FFFF',
                  draggable: false,
                  autoClose: false,
                  contextmenu: true,
                  permanent: true,
                });
            marker.id = stationId;
            marker.options.name = stationId;
            marker.addTo(map).openTooltip();

            storeMarker(m);
          }
        }
      /*
              var msg = JSON.parse(message.payloadString);
              for (var item of arrayOfPoints) {
                  // let item = arrayOfPoints[i];
                  // if (i.hasOwnProperty(RadioPoint.id)) {
                      L.marker([item.lat, item.lng]).addTo(map)
                          .bindPopup(item.id)
                          .openPopup();
                  // }
              }
       */
    }

    client.onConnectionLost = onConnectionLost;
    client.onMessageArrived = onMessageArrived;
    client.connect({onSuccess: onConnect});
}

L.Radio = L.GridLayer.extend({
        options: {},

        initialize: function(options) {
            L.GridLayer.prototype.initialize.call(this, options);
        },

        onAdd: function(map) {
            L.GridLayer.prototype.onAdd.call(this, map);
            map.on('mousemove', this.onMouseMove, this);
            map.on('zoomend', this.onZoomEnd, this);
            map.on('zoomstart', this.onZoomStart, this);
            mqtt_init(map);
            // this.map = map;
            loadMarkers(map);
        },

        onRemove: function(map) {
            map.off('mousemove', this.onMouseMove, this);
            L.TileLayer.prototype.onRemove.call(this, map);
            map.off('zoomend', this.onZoomEnd, this);
            map.off('zoomstart', this.onZoomStart, this);

            client.unsubscribe("coordinates");
            client.disconnect();
            arrayOfPoints.splice();
            map.eachLayer((layer) => {
              if (layer instanceof L.Marker) {
                layer.remove();
              }
          });
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
