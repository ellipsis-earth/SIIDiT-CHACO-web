import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

import tokml from 'tokml';

import {divIcon} from 'leaflet';

import FileSaver from 'file-saver';
import streamSaver from 'streamsaver';
import { isAndroid, isIOS, isMobile } from 'react-device-detect';

const TILE = 'tzile';
const STANDARD_TILE = 'standard_tile';
const POLYGON = 'polygon';
const CUSTOM_POLYGON = 'custom_polygon'

const ViewerUtility = {

  admin: 'admin',

  tileLayerType: TILE,
  standardTileLayerType: STANDARD_TILE,
  polygonLayerType: POLYGON,
  customPolygonTileLayerType: CUSTOM_POLYGON,

  drawnPolygonLayerType: 'drawn_polygon',

  tileLayerZIndex: 200,
  standardTileLayerZIndex: 1000,
  polygonLayerZIndex: 1001,
  customPolygonLayerZIndex: 1100,
  selectedElementLayerZIndex: 1150,
  drawnPolygonLayerZIndex: 1151,

  dataPaneAction: {
    analyse: 'analyse',
    geoMessage: 'geoMessage',
    createCustomPolygon: 'create_custom_polygon',
    editCustomPolygon: 'edit_custom_polygon',
    feed: 'geomessage_feed'
  },

  dataGraphType: {
    classes: 'classes',
    measurements: 'measurements'
  },

  specialClassName: {
    allClasses: 'all classes',
    mask: 'mask',
    outside_area: 'outside_area',
    noClass: 'no class',
    cloudCover: 'cloud_cover'
  },

  geomessageFormType: {
    text: 'text',
    numeric: 'numeric',
    boolean: 'boolean'
  },

  flyToType: {
    map: 'map',
    currentLocation: 'current_location',
    currentElement : 'current_element',

    location: 'location',
    standardTile: STANDARD_TILE,
    polygon: POLYGON,
    customPolygon: CUSTOM_POLYGON
  },

  download: (fileName, text, mime) => {
    if (mime === 'application/vnd.google-earth.kml+xml')
    {
      text = tokml(JSON.parse(text))
    }

    if (isMobile && isAndroid) {
      const fileStream = streamSaver.createWriteStream(fileName);

      new Response(text).body
        .pipeTo(fileStream)
        .then(() => {
        },
        (e) => {
          console.warn(e);
        });
    }
    else if (isMobile && isIOS) {
      window.ReactNativeWebView.postMessage(JSON.stringify({
        fileName: fileName,
        data: text,
        mime: mime
      }));
    }
    else {
      let file = new File([text], fileName, {type: `${mime};charset=utf-8}`});
      FileSaver.saveAs(file);
    }
  },

  createGeoJsonLayerStyle: (color, weight, fillOpacity) => {
    return {
      color: color ? color : '#3388ff',
      weight: weight || weight === 0 ? weight : 1,
      fillOpacity: fillOpacity || fillOpacity === 0 ? fillOpacity : 0.03,
      opacity: 0.75,
    };
  },

  isPrivateProperty: 'isPrivate',

  returnMarker: (color, markerSize, iconName) => {
    let IconClass = require(('@material-ui/icons/' + iconName)).default;
    let temp = <IconClass viewBox={`${markerSize.y/4} 0 ${markerSize.y/2} ${markerSize.y}`} className="layerMarker" style={{fill: color, filter: 'drop-shadow(1px 1px 1px rgba(0,0,0,0.5))', width: markerSize.x*2 + 'px', height: markerSize.y*2 + 'px'}}/>;
    let markerIcon = renderToStaticMarkup(temp);
    let icon = divIcon({
      className: 'layerDivIcon',
      html: markerIcon,
      iconSize: [markerSize.x*2, markerSize.y*2],
      iconAnchor: [markerSize.x, markerSize.y*2],
    });

    return icon;
  }

}

export default ViewerUtility;
