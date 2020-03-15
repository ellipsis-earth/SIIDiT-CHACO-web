import React, { Component } from 'react';

import { motion } from "framer-motion";

import Button from '@material-ui/core/Button';
import MobileStepper from '@material-ui/core/MobileStepper';

import KeyboardArrowLeft from '@material-ui/icons/KeyboardArrowLeft';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';

import Toolbar from './Toolbar/Toolbar';

import ApiManager from '../../../ApiManager';
import ViewerUtility from '../ViewerUtility';

const STROKE_MIN = 1; // Min, max and step size for stroke size
const STROKE_MAX = 60;
const STROKE_STEP = 1;

const ZOOM_MIN = 1.0; //Min transform level for zooming
const ZOOM_MAX = 7.5; //Max transform level for zooming
const ZOOM_STEP = 0.2; //Step size for zooming in and out

const IGNORE_CLASSES = [
  'no class',
  'outside_area'
];

const ERASER_CLASS = {
  name: 'eraser',
  color: '#ffffff',
  number: 0
};

/*const MASK_CLASS = {
  name: 'mask',
  color: '#ffffffff',
  number: -1,
  colorRgb: {r: 255, g: 255, b: 255, a: 255}
};*/

const IMAGE_SIZE = 256;

class AnnotateTool extends Component {
  pressedMouseButton = null;
  mouseOnCanvas = false;
  mouseOnCanvas = true;

  LEEWAY = 5;

  prevMousePos = { offsetX: 0, offsetY: 0 };

  polygonCoords = [];

  constructor(props) {
    super(props);

    this.state = {
      init: false,
      classes: null,

      strokeSize: 5,
      prevZoom: 0,
      zoom: 0,
      hideLabel: false,
      hidePolygons: true,
      translate: {
        prevX: '-50%',
        prevY: '-50%',
        x: '-50%',
        y: '-50%'
      },

      activeStep: -1,
      stepper: null,

      tooltip: null,
    };

    this.canvas0 = React.createRef();
    this.canvas1 = React.createRef();
    this.canvasTemp = React.createRef();
    this.canvas2 = React.createRef();

    this.backgroundImage = null;
    this.polygonImage = null;

    this.TILE_TYPE = this.props.map.models[0].visualizationName;

    this.lastPoint = {};
    this.mouseType = null;

    this.pinchStart = null;
  }

  componentDidMount = () => {
    this.fetchClasses();
    this.createStepper();
  }

  createStepper = () => {
    let step = this.state.activeStep === -1 ? this.props.tileInfo.length : this.state.activeStep;
    let stepper = (<div className='stepperContainer'>
      <div className='stepperInfo'>
        <span className='stepperInfoItem'>user: {this.props.tileInfo[step - 1] ? this.props.tileInfo[step - 1].user : 'automated'}</span>
        <span className='stepperInfoItem'>date: {new Date(this.props.tileInfo[step - 1] ? this.props.tileInfo[step - 1].date : this.props.map.timestamps.find(x => x.timestamp === this.props.timestamp).dateTo).toLocaleString()}</span>
      </div>
      <MobileStepper
      className='annotateStepper'
      variant="dots"
      steps={this.props.tileInfo.length + 1}
      activeStep={step}
      nextButton={
        <Button color='primary' size="small" onClick={() => {this.handleStepper(1)}} disabled={this.state.activeStep === -1 || this.state.activeStep >= this.props.tileInfo.length}>
          Next <KeyboardArrowRight />
        </Button>
      }
      backButton={
        <Button color='primary' size="small" onClick={() => {this.handleStepper(-1)}} disabled={this.state.activeStep !== -1 && this.state.activeStep <= 0}>
          <KeyboardArrowLeft /> Back
        </Button>
      }
    /></div>)

    let stateObj = {stepper: stepper};

    if(this.state.activeStep === -1)
    {
      stateObj.activeStep = this.props.tileInfo.length;
    }

    let init = this.state.activeStep === -1 ? false : true;

    this.setState(stateObj, () => {this.getNewImage(init)});
  }

  handleStepper = (value) => {
    this.setState({activeStep: this.state.activeStep + value}, () => {this.createStepper()});
  }

  rasterOpacinator = (x, y, size = 2) => {
    return((Math.floor(x/size) % 2 + Math.floor(y/size) % 2) % 2)
  }

  getNewImage = (stepper = false) => {
    let tileId = this.props.tileId;
    let urlRgb = `/tileService/${this.props.map.id}/${this.props.timestamp}/${this.TILE_TYPE}/${tileId.zoom}/${tileId.tileX}/${tileId.tileY}`;
    let urlLabel = `/tileService/${this.props.map.id}/${this.props.timestamp}/label/${tileId.zoom}/${tileId.tileX}/${tileId.tileY}${this.props.tileInfo[this.state.activeStep] ? '/' + this.props.tileInfo[this.state.activeStep].version : ''}`;

    if (this.props.user) {
      let tokenString = `?token=${this.props.user.token}`;
      urlRgb += tokenString;
      urlLabel += tokenString;
    }

    let labelImagePromise = ApiManager.get(urlLabel)
      .catch(err => {
        if (err.status === 404 || err.status === 400) {
          return null;
        }
        else {
          throw err;
        }
      });

    let rgbImageData = null;
    let labelImageData = null;

    let init = () => {
      let reader = new FileReader();
      let reader2 = new FileReader();
      let hasRgbImage = rgbImageData !== null;
      let hasLabelImage = labelImageData !== null;

      let cb = () => {
        let rgbImage = new Image();
        let labelImage = new Image();

        if (hasRgbImage) {
          rgbImage.src = reader.result;
        }

        if (hasLabelImage) {
          labelImage.src = reader2.result;
        }

        let canvas0 = this.canvas0.current;
        let canvas1 = this.canvas1.current;
        let canvasTemp = this.canvasTemp.current;
        let canvas2 = this.canvas2.current;

        canvas0.width = IMAGE_SIZE;
        canvas0.height = IMAGE_SIZE;
        if (this.backgroundImage)
        {
            canvas0.getContext('2d').drawImage(this.backgroundImage, 0, 0, canvas0.width, canvas0.height);
        }
        else
        {
          rgbImage.onload = () => {
            this.backgroundImage = rgbImage;
            canvas0.getContext('2d').drawImage(rgbImage, 0, 0, canvas0.width, canvas0.height);
          };
        }

        if (this.polygonImage)
        {
          canvas1.getContext('2d').drawImage(this.polygonImage, 0, 0, canvas1.width, canvas1.height);
        }
        else
        {
          let body = {
            mapId: this.props.map.id,
            tileId: this.props.tileId,
            channels: ['geometries'],
            timestamp: this.props.timestamp,
          }
          ApiManager.post('/raster/get', body, this.props.user)
          .then(raster => {
            let width = raster.data.length;
            let height = raster.data.length;
            let buffer = new Uint8ClampedArray(width * height * 4);

            for(var y = 0; y < height; y++)
            {
              for(var x = 0; x < width; x++)
              {
                var pos = (y * width + x) * 4;

                buffer[pos]   = 0;
                buffer[pos+1] = 0;
                buffer[pos+2] = 0;
                buffer[pos+3] = raster.data[y][x][0] === 0 ? 0 : (127 / (this.rasterOpacinator(x, y) + 1));
              }
            }

            let ctx = canvas1.getContext('2d');

            canvas1.width = width;
            canvas1.height = height;

            let idata = ctx.createImageData(width, height);
            idata.data.set(buffer);
            ctx.putImageData(idata, 0, 0);
          })
        }

        canvas2.width = IMAGE_SIZE;
        canvas2.height = IMAGE_SIZE;
        if (hasLabelImage) {
          labelImage.onload = () => {
            let ctx = canvas2.getContext('2d');
            ctx.drawImage(labelImage, 0, 0, canvas2.width, canvas2.height);
            let imgData = ctx.getImageData(0, 0, canvas2.width, canvas2.height);
            let data = imgData.data;
            for (let i = 0; i < data.length; i+=4) {
              if (data[i] || data[i+1] || data[i+2]) {
                data[i+3] = 255;
              }
            }
            ctx.putImageData(imgData, 0, 0);
          };
        }

        canvasTemp.width = IMAGE_SIZE;
        canvasTemp.height = IMAGE_SIZE;
        this.canvasTemp = canvasTemp.getContext('2d');

        this.canvasMain = canvas2.getContext('2d');
        this.canvasMain.imageSmoothingEnabled = false;

        // Sets initial drawing tool settings
        this.canvasMain.lineJoin = 'miter';
        this.canvasMain.lineCap = 'butt';

        let initZoomSize = window.innerWidth >= window.innerHeight ? (document.getElementsByClassName('canvas')[0].clientHeight / IMAGE_SIZE / ZOOM_STEP * 2) : (document.getElementsByClassName('canvas')[0].clientWidth / IMAGE_SIZE / ZOOM_STEP);
        this.zoom(initZoomSize);

        this.setState({ init: true });
      }

      if (hasRgbImage && !stepper) {
        reader.readAsDataURL(rgbImageData);
      }
      if (hasLabelImage) {
        reader2.readAsDataURL(labelImageData);
      }

      if (hasRgbImage && !stepper) {
        reader.onloadend = () => {
          if (hasLabelImage) {
            reader2.onloadend = cb;
          }
          else {
            cb();
          }
        };
      }
      else {
        if (hasLabelImage) {
            reader2.onloadend = cb;
          }
          else {
            cb();
          }
      }
    }

    if(!stepper)
    {
      ApiManager.get(urlRgb)
        .then(_rgbImageData => {
          rgbImageData = _rgbImageData;
          return labelImagePromise
        })
        .then(_labelImageData => {
          labelImageData = _labelImageData;

          init();
        })
        .catch(err => {
          if (err.status === 400 || err.status === 404) {
            console.error(err)
            init();
          }
          else {
            alert('An error occurred while getting image.');
          }
        });
    }
    else
    {
      labelImagePromise
      .then(_labelImageData => {
        labelImageData = _labelImageData;

        init();
      })
      .catch(err => {
        if (err.status === 400 || err.status === 404) {
          init();
        }
        else {
          alert('An error occurred while getting image.');
        }
      });
    }
  }

  fetchClasses = () => {
    let mapClasses = this.props.map.classes;

    let classesInfo = [];
    for (let i = 0; i < mapClasses.length; i++) {
      let timestampClasses = mapClasses[i];

      for (let y = 0; y < timestampClasses.classes.length; y++) {
        let _class = timestampClasses.classes[y];

        if (_class.name === ViewerUtility.specialClassName.mask) {
          continue;
        }

        let existingClass = classesInfo.find(x => x.name === _class.name);

        if (!existingClass) {
          existingClass = {
            ..._class
          };

          existingClass.color = `#${_class.color.substring(0, 6)}`;
          existingClass.colorRgb = hexToRgb(existingClass.color);
          existingClass.colorInt = getUnsignedRgba(existingClass.colorRgb);

          classesInfo.push(existingClass);
        }
      }

      classesInfo.sort((a, b) => {
        if (a.name > b.name) {
          return 1;
        }
        else if (a.name < b.name) {
          return -1;
        }
        else {
          return 0;
        }
      });
    }

    // classesInfo.push(MASK_CLASS);

    this.setState({ classes: classesInfo, drawingClass: classesInfo[0], tool: 'labeler'});
  }

  translateHelper = (pos) => {
    let translate = {}
    translate.prevX = parseInt(this.state.translate.x.split('%')[0]);
    translate.prevY = parseInt(this.state.translate.y.split('%')[0]);

    translate.x = Math.round(-100 + this.prevMousePos.offsetX / IMAGE_SIZE * 100);
    translate.y = Math.round(-100 + this.prevMousePos.offsetY / IMAGE_SIZE * 100);

    translate.prevX = translate.prevX.toString() + '%';
    translate.prevY = translate.prevY.toString() + '%';

    translate.x = translate.x.toString() + '%';
    translate.y = translate.y.toString() + '%';

    return translate;
  }

  zoom = (direction) => {
    let translate = null;

    /*if (this.prevMousePos && this.state.init)
    {
      translate = this.translateHelper();
    }*/

    let newZoomFactor = null;
    if(this.state.zoom < 2)
    {
      newZoomFactor = this.state.zoom + (ZOOM_STEP * direction / 2);
    }
    else
    {
      newZoomFactor = this.state.zoom + (ZOOM_STEP * direction * 2);
    }

    if (newZoomFactor > ZOOM_MAX) {
      newZoomFactor = ZOOM_MAX;
    }
    else if (newZoomFactor < ZOOM_MIN) {
      newZoomFactor = ZOOM_MIN
    }

    /*let canvases = document.getElementsByClassName('layers');

    for (let i = 0; i < canvases.length; i++) {
      console.log(canvases[i])
      canvases[i].style.transform = 'translate(-50%, -50%) scale(' + newZoomFactor + ')';
    }

      console.log(this.canvasTemp.current)*/

      /*console.log(translate)*/

      let stateObj = { prevZoom: this.state.zoom,  zoom: newZoomFactor }
      if(translate){stateObj.translate = translate};

    this.setState(stateObj);
  }

  paint = (prevPos, currPos, strokeSize) => {
    if (!this.mouseOnCanvas || this.pressedMouseButton === 2 || prevPos === currPos) {
      return;
    }

    let currentTool = this.state.tool;

    let offsetX = currPos.offsetX;
    let offsetY = currPos.offsetY;

    let x = prevPos.offsetX;
    let y = prevPos.offsetY;

    let radius = Math.ceil(strokeSize / 2);

    // Interpolation of points to be drawn in between currPos and prevPos to obtain a line
    let diffX = offsetX - x;
    let diffY = offsetY - y;
    let maxDiff = Math.ceil(Math.max(Math.abs(diffX), Math.abs(diffY))) + 1;

    if (currentTool === 'eraser') {
      this.canvasMain.globalCompositeOperation = 'destination-out';
      this.canvasMain.fillStyle = ERASER_CLASS.color;

      let i = 0;

      while (i < maxDiff) {
        let centerX = x + Math.round(i * (diffX / maxDiff));
        let centerY = y + Math.round(i * (diffY / maxDiff));

        aliasedCircle(this.canvasMain, centerX, centerY, radius);
        this.canvasMain.fill();
        i++;
      }
    }
    else {
      let i = 0;

      while (i < maxDiff) {
        let centerX = x + Math.round(i * (diffX / maxDiff));
        let centerY = y + Math.round(i * (diffY / maxDiff));

        aliasedCircle(this.canvasMain, centerX, centerY, radius);

        this.canvasMain.globalCompositeOperation = 'destination-out';
        this.canvasMain.fillStyle = ERASER_CLASS.color;
        this.canvasMain.fill();
        this.canvasMain.globalCompositeOperation = 'source-over';
        this.canvasMain.fillStyle = this.state.drawingClass.color;
        this.canvasMain.fill();

        i++;
      }
    }
  }

  drawCursor = (currPos) => {
    let currentTool = this.state.tool;

    this.canvasTemp.clearRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);

    if (!this.mouseOnCanvas || this.pressedMouseButton === 2) {
      return;
    }

    let offsetX = currPos.offsetX;
    let offsetY = currPos.offsetY;
    let radius = Math.ceil(this.state.strokeSize / 2);

    this.canvasTemp.globalCompositeOperation = 'source-over';
    if (currentTool === 'labeler') {
      let drawingClass = this.state.drawingClass;
      this.canvasTemp.fillStyle = drawingClass.color;
    }
    else if (currentTool === 'eraser') {
      this.canvasTemp.fillStyle = ERASER_CLASS.color;
    }

    aliasedCircle(this.canvasTemp, offsetX, offsetY, radius);
    this.canvasTemp.fill();
  }

  drawPolygon = () => {
    this.canvasTemp.globalCompositeOperation = 'source-over';
    this.canvasTemp.strokeStyle = this.state.drawingClass.color;
    this.canvasTemp.fillStyle = this.state.drawingClass.color;
    this.canvasTemp.lineWidth = 3;

    let coordsLen = this.polygonCoords.length;

    // If it's the first point, begin path
    if (coordsLen === 1) {
      let firstPointX = this.polygonCoords[0].offsetX;
      let firstPointY = this.polygonCoords[0].offsetY;

      this.canvasTemp.beginPath();
      this.canvasTemp.moveTo(firstPointX, firstPointY);
      this.canvasTemp.arc(
        firstPointX,
        firstPointY,
        this.LEEWAY,
        0,
        2 * Math.PI
      );
      this.canvasTemp.fill();
      this.canvasTemp.moveTo(firstPointX, firstPointY);
      this.canvasTemp.closePath();
    }
    else {
      // If the starting point is clicked again, with some leeway, fill the polygon
      let firstPointX = this.polygonCoords[0].offsetX;
      let firstPointY = this.polygonCoords[0].offsetY;
      let firstPointType = this.polygonCoords[0].type;

      let lastPointX = this.polygonCoords[coordsLen-1].offsetX;
      let lastPointY = this.polygonCoords[coordsLen-1].offsetY;
      let lastPointType = this.polygonCoords[coordsLen-1].type;

      if ((firstPointX - this.LEEWAY <= lastPointX && firstPointX + this.LEEWAY >= lastPointX) && (firstPointY - this.LEEWAY <= lastPointY && firstPointY + this.LEEWAY >= lastPointY) && firstPointType === lastPointType) {
        this.lastPoint = this.polygonCoords[coordsLen-1];
        this.polygonCoords.pop(); // Remove last coordinate as it should connect to start point
        this.fillPolygon();
      }
      else {
        this.canvasTemp.beginPath();
        this.canvasTemp.moveTo(this.polygonCoords[coordsLen-2].offsetX,this.polygonCoords[coordsLen-2].offsetY);
        // Additional points are connected with a line to the previous point
        this.canvasTemp.lineTo(lastPointX, lastPointY);
        this.canvasTemp.stroke();
        this.canvasTemp.closePath();
      }
    }
  }

  fillPolygon = () => {
    if (this.polygonCoords.length === 0) {
      return;
    }

    // Construct and fill the polygon
    this.canvasMain.beginPath();
    this.canvasMain.moveTo(this.polygonCoords[0].offsetX, this.polygonCoords[0].offsetY);
    for (let i = 1; i < this.polygonCoords.length; i++) {
      this.canvasMain.lineTo(this.polygonCoords[i].offsetX,this.polygonCoords[i].offsetY);
    }
    this.canvasMain.closePath();

    this.canvasMain.globalCompositeOperation = 'destination-out';
    this.canvasMain.fillStyle = ERASER_CLASS.color;
    this.canvasMain.fill();
    this.canvasMain.globalCompositeOperation = 'source-over';
    this.canvasMain.fillStyle = this.state.drawingClass.color;
    this.canvasMain.fill();

    let coordsLen = this.polygonCoords.length;
    for (let i = 1; i < coordsLen; i++) {
      this.paint(this.polygonCoords[i-1], this.polygonCoords[i], 3);
    }
    this.paint(this.polygonCoords[coordsLen-1], this.polygonCoords[0], 3);

    // Reset polygon
    this.erasePolygon();
  }

  erasePolygon = () => {
    this.canvasTemp.clearRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);
    this.polygonCoords = [];
  }

  changeToolSize = (steps, cb) => {
    let newStrokeSize = this.state.strokeSize + STROKE_STEP * steps;

    if (newStrokeSize < STROKE_MIN) {
      newStrokeSize = STROKE_MIN;
    }
    else if (newStrokeSize > STROKE_MAX) {
      newStrokeSize = STROKE_MAX;
    }

    this.setState({ strokeSize: newStrokeSize }, cb);
  }

  saveCanvas = () => {
    if (this.saving) {
      return;
    }

    this.saving = true;

    const labelImage = this.canvasMain.getImageData(0, 0, IMAGE_SIZE, IMAGE_SIZE);

    const labelBuffer32 = new Uint32Array(labelImage.data.buffer);
    const dataArray = [];
    for (let y = 0; y < IMAGE_SIZE; y++) {
      dataArray.push(new Array(IMAGE_SIZE).fill(0));
    }

    let classesInfo = this.state.classes.filter(x => !IGNORE_CLASSES.includes(x.name));

    let count = 0;

    for (let y = 0; y < IMAGE_SIZE; y++) {
      for (let x = 0; x < IMAGE_SIZE; x++) {
        let labelColorInt = labelBuffer32[count];

        let labelNumber = null;
        let rgbaColor = getRgbaColor(labelColorInt);

        if (labelColorInt !== 0) {
          let matchingClass = classesInfo.find(z => {
            let diffR = Math.abs(z.colorRgb.r - rgbaColor.r);
            let diffG = Math.abs(z.colorRgb.g - rgbaColor.g);
            let diffB = Math.abs(z.colorRgb.b - rgbaColor.b);

            if (diffR + diffG + diffB < 20) {
              return true;
            }

            return false;
          });
          if (matchingClass) {
            labelNumber = matchingClass.number;
          }
        }

        if (labelNumber === null && labelColorInt !== 0) {
          console.warn('Unexpected label color: ' + JSON.stringify(rgbaColor));
        };

        if (labelNumber !== null) {
          dataArray[y][x] = labelNumber;
        }

        count++;
      }
    }

    let body = {
      mapId: this.props.map.id,
      timestamp: this.props.timestamp,
      store: true,
      tileId: this.props.tileId,
      type: 'label',
      newLabel: dataArray
    };

    ApiManager.post('/raster/submit', body, this.props.user)
      .then(() => {
        this.saving = false;
        this.props.onClose();
      })
      .catch(err => {
        this.saving = false;
        alert('An error occurred while saving. Please contact us.');
      });
  }

  onWheel = (e) => {
    if (!this.state.init) {
      return;
    }

    let steps = null;

    if(e.deltaY > 0)
    {
      steps = Math.ceil(e.deltaY / 25);
    }
    else
    {
      steps = Math.ceil(e.deltaY / 10);
    }


    if (this.pressedMouseButton === 2) {
      let currPos = {
        offsetX: e.nativeEvent.offsetX ? e.nativeEvent.offsetX : e.nativeEvent.layerX,
        offsetY: e.nativeEvent.offsetY ? e.nativeEvent.offsetY : e.nativeEvent.layerY
      };

      this.changeToolSize(steps, () => {
        this.drawCursor(currPos);
      });
    }
    else {
      this.zoom(steps);
    }

    //e.preventDefault();

    return false;
  }

  onMouseDown = (e) => {
    if (!this.state.init) {
      return;
    }

    console.log(e.nativeEvent.type);

    if(!this.mouseType || this.mouseType === e.nativeEvent.type)
    {
      if(!this.mouseType){this.mouseType = e.nativeEvent.type};

      let nativeEvent = e.nativeEvent;
      let currentTool = this.state.tool;

      this.pressedMouseButton = e.buttons ? e.buttons : e.touches.length;


      let offsetX = null;
      let offsetY = null;
      let rect = null;

      if(e.touches)
      {
        rect = e.target.getBoundingClientRect();

        offsetX = Math.round((e.targetTouches[0].pageX - rect.left)/this.state.zoom);
        offsetY = Math.round((e.targetTouches[0].pageY - rect.top)/this.state.zoom);
      }
      else
      {
        offsetX = nativeEvent.offsetX ? nativeEvent.offsetX : nativeEvent.layerX;
        offsetY = nativeEvent.offsetY ? nativeEvent.offsetY : nativeEvent.layerY;
      }

      //nativeEvent.preventDefault();

      let pos = { offsetX: offsetX, offsetY: offsetY, type: e.nativeEvent.type };

      if (this.pressedMouseButton === 1 || this.pressedMouseButton === 3) {
        if (currentTool === 'polygon') {
          if (!this.polygonDone) {
            if(!(pos.offsetX - this.LEEWAY <= this.lastPoint.offsetX && pos.offsetX + this.LEEWAY >= this.lastPoint.offsetX) && !(pos.offsetY - this.LEEWAY <= this.lastPoint.offsetY && pos.offsetY + this.LEEWAY >= this.lastPoint.offsetY))
            {
              this.polygonCoords.push(pos);
              this.drawPolygon();
            }
          }
        }
        else {
          this.paint(pos, pos, this.state.strokeSize);
        }
      }
      else if(e.touches && e.touches.length === 2)
      {
        console.log('pinchStart')
        this.pinchStart = Math.hypot((e.touches[0].pageX - rect.left) - (e.touches[1].pageX - rect.left), (e.touches[0].pageY - rect.top) - (e.touches[1].pageY - rect.top));

        pos.offsetX = (e.touches[0].pageX + ((e.touches[1].pageX - e.touches[0].pageX) / 2) - rect.left) / this.state.zoom;
        pos.offsetY = (e.touches[0].pageY + ((e.touches[1].pageY - e.touches[0].pageY) / 2) - rect.top) / this.state.zoom;
      }

      this.prevMousePos = pos;
    }
  }

  onMouseMove = (e) => {
    if (!this.state.init) {
      return;
    }

    if (!this.mouseOnCanvas) {
      return;
    }

    let currentTool = this.state.tool;

    let offsetX = null;
    let offsetY = null;
    let rect = null;

    if(e.touches)
    {
      rect = e.target.getBoundingClientRect();

      offsetX = Math.round((e.targetTouches[0].pageX - rect.left)/this.state.zoom);
      offsetY = Math.round((e.targetTouches[0].pageY - rect.top)/this.state.zoom);
    }
    else
    {
      offsetX = e.nativeEvent.offsetX ? e.nativeEvent.offsetX : e.nativeEvent.layerX;
      offsetY = e.nativeEvent.offsetY ? e.nativeEvent.offsetY : e.nativeEvent.layerY;
    }

    let pos = {
      offsetX: offsetX,
      offsetY: offsetY,
      type: e.nativeEvent.type
    };

    if ((this.pressedMouseButton === 1 || this.pressedMouseButton === 3) && this.prevMousePos) {
      if (currentTool === 'labeler' || currentTool === 'eraser') {
        this.paint(this.prevMousePos, pos, this.state.strokeSize);
      }
    }
    else if(e.touches && e.touches.length === 2)
    {
      this.zoom((Math.hypot((e.touches[0].pageX - rect.left) - (e.touches[1].pageX - rect.left), (e.touches[0].pageY - rect.top) - (e.touches[1].pageY - rect.top)) - this.pinchStart) / 10);
      this.pinchStart = Math.hypot((e.touches[0].pageX - rect.left) - (e.touches[1].pageX - rect.left), (e.touches[0].pageY - rect.top) - (e.touches[1].pageY - rect.top));
      pos.offsetX = (e.touches[0].pageX + ((e.touches[1].pageX - e.touches[0].pageX) / 2) - rect.left) / this.state.zoom;
      pos.offsetY = (e.touches[0].pageY + ((e.touches[1].pageY - e.touches[0].pageY) / 2) - rect.top) / this.state.zoom;
    }

    if (currentTool === 'labeler' || currentTool === 'eraser') {
      this.drawCursor(pos);
    }

    this.prevMousePos = pos;
  }

  onMouseUp = (e) => {
    if (!this.state.init) {
      return;
    }

    if(this.state.tool === 'labeler')
    {
      this.canvasTemp.clearRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);
    }

    this.pinchStart = null;
    this.mouseType = null;
    this.pressedMouseButton = e.nativeEvent.buttons;
  }

  onMouseLeave = (e) => {
    if (!this.state.init) {
      return;
    }

    this.onMouseMove(e);

    if (this.state.tool !== 'polygon') {
      this.canvasTemp.clearRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);
    }

    this.prevMousePos = null;
    /*this.mouseOnCanvas = false;*/
  }

  onMouseEnter = (e) => {
    if (!this.state.init) {
      return;
    }

    let nativeEvent = e.nativeEvent;

    this.pressedMouseButton = e.buttons;

    this.prevMousePos = {
      offsetX: nativeEvent.offsetX ? nativeEvent.offsetX : nativeEvent.layerX,
      offsetY: nativeEvent.offsetY ? nativeEvent.offsetY : nativeEvent.layerY
    };

    this.mouseOnCanvas = true;
  }

  onToolbarClick = (tool, override = false) => {
    if (!this.state.init) {
      return;
    }

    if (tool !== this.state.tool) {
      this.canvasTemp.clearRect(0, 0, IMAGE_SIZE, IMAGE_SIZE);
    }

    if(tool === this.state.tool && !override)
    {
      this.erasePolygon();
      this.setState({ subtoolbar: false, tool: null });
    }
    else if (tool === 'labeler' || tool === 'polygon')
    {
      if(tool === 'labeler'){ this.erasePolygon() };

      let stateObj = { subtoolbar: true, tool: tool };
      if (!this.state.drawingClass || this.state.drawingClass === ERASER_CLASS)
      {
        stateObj.drawingClass = this.state.classes[0];
      }

      this.setState(stateObj);
    }
    else if (tool === 'eraser') {
      /*this.erasePolygon();*/
      this.setState({ subtoolbar: false , tool: tool, drawingClass: ERASER_CLASS });
    }
    else if (tool === 'toggle-label-layer') {
      this.setState({ subtoolbar: false, hideLabel: !this.state.hideLabel })
    }
    else if (tool === 'toggle-polygon-layer') {
      this.setState({ subtoolbar: false, hidePolygons: !this.state.hidePolygons })
    }
    else if (tool === 'save') {
      this.saveCanvas();
    }
  }

  onSubToolbarClick = (e, _class) => {
    if (!this.state.init) {
      return;
    }

    let el = e.target;

    while(el.tagName !== 'BUTTON')
    {
      el = el.parentNode;
    }

    this.setState({
      drawingClass: _class,
      subtoolbar: false
    }, () => {this.onToolbarClick(el.parentNode.className.split('classesGrid ')[1], 'override')});
  }

  render() {
    let labelLayerOpacity = null;
    if (this.state.hideLabel) {
      labelLayerOpacity = 0.0;
    }

    let polygonLayerOpacity = null;
    if (this.state.hidePolygons) {
      polygonLayerOpacity = 0.0;
    }

    let initial = {scale: this.state.prevZoom, x: this.state.translate.prevX, y: this.state.translate.prevY}
    let animate = {scale: this.state.zoom, x: this.state.translate.x, y: this.state.translate.y}

    /*console.log(initial, animate)*/

    return (
      <div className='labelTool'>
        <div
          className='canvas'
          onContextMenu={e => e.preventDefault()}
          /*onMouseDown={this.onMouseDown}
          onMouseUp={this.onMouseUp}
          onWheel={this.onWheel}*/
        >
          <motion.canvas id='layer-bottom' className='layers'
            initial={initial}
            animate={animate}
            ref={this.canvas0}
            style = {{ zIndex: 0 }}
          />
          <motion.canvas id='layer-upper' className='layers'
            initial={initial}
            animate={animate}
            ref={this.canvas2}
            style = {{ zIndex: 1, opacity: labelLayerOpacity }}
          />
          <motion.canvas id='layer-polygon' className='layers'
            initial={initial}
            animate={animate}
            ref={this.canvas1}
            style = {{ zIndex: 2 , opacity: polygonLayerOpacity}}
          />
          <motion.canvas id='layer-temp' className='layers'
            initial={initial}
            animate={animate}
            ref={this.canvasTemp}
            style = {{ zIndex: 3 }}
            onMouseDown={this.onMouseDown}
            onMouseUp={this.onMouseUp}
            onMouseLeave={this.onMouseLeave}
            onMouseOver={this.onMouseEnter}
            onMouseMove={this.onMouseMove}
            onWheel={this.onWheel}
            onTouchStart={this.onMouseDown}
            onTouchEnd={this.onMouseUp}
            onTouchMove={this.onMouseMove}
          />
        </div>
        <Toolbar
          STROKE_STEP={STROKE_STEP}
          ZOOM_STEP={ZOOM_STEP}
          IGNORE_CLASSES={IGNORE_CLASSES}
          classes={this.state.classes}
          onToolbarClick={this.onToolbarClick}
          onSubToolbarClick={this.onSubToolbarClick}
          changeToolSize={this.changeToolSize}
          zoom={this.zoom}
          tool={this.state.tool}
          strokeSize={this.state.strokeSize}
          hideLabel={this.state.hideLabel}
          hidePolygons={this.state.hidePolygons}
          mask={this.props.map.models[0].usePolygons}
        />
        {this.state.stepper}
      </div>
    );
  }
}

function aliasedCircle(canvas, xc, yc, r) {  // NOTE: for fill only!
  var x = r, y = 0, cd = 0;

  canvas.beginPath();

  // middle line
  canvas.rect(xc - x, yc, r<<1, 1);

  while (x > y) {
    cd -= (--x) - (++y);
    if (cd < 0) cd += x++;
    canvas.rect(xc - y, yc - x, y<<1, 1);    // upper 1/4
    canvas.rect(xc - x, yc - y, x<<1, 1);    // upper 2/4
    canvas.rect(xc - x, yc + y, x<<1, 1);    // lower 3/4
    canvas.rect(xc - y, yc + x, y<<1, 1);    // lower 4/4
  }

  canvas.closePath();
}

function hexToRgb(hex) {
  let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16),
      a: 255
  } : null;
}

function getUnsignedRgba(color) {
  let r = color.r & 0xFF;
  let g = color.g & 0xFF;
  let b = color.b & 0xFF;
  let a = color.a & 0xFF;
  // Ending bit wise ops with >>> 0 to make it unsigned
  return ((a << 24) | (b << 16) | (g << 8) | (r)) >>> 0;
}

function getRgbaColor(color) {
  return {
      a: (color >>> 24) & 0xFF,
      b: (color >>> 16) & 0xFF,
      g: (color >>> 8) & 0xFF,
      r: color & 0xFF
  };
}

export default AnnotateTool;