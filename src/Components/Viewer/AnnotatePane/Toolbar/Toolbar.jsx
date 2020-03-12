import React, { Component } from 'react';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faPen,
  faSearchPlus,
  faSearchMinus,
  faPlus,
  faMinus,
  faEraser,
  faDrawPolygon,
  faSave,
} from '@fortawesome/free-solid-svg-icons'

import Drawer from '@material-ui/core/Drawer';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import Fab from '@material-ui/core/Fab';
import IconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import Typography from '@material-ui/core/Typography';
import Zoom from '@material-ui/core/Zoom';

import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import CircleIcon from '@material-ui/icons/FiberManualRecord';
import LabelIcon from '@material-ui/icons/LocalOffer';
import LayersIcon from '@material-ui/icons/Layers';
import PolygonsIcon from '@material-ui/icons/Dashboard';


class Toolbar extends Component {
  constructor(props) {
    super(props);

    this.state = {
      tooltip: null,
      tooltipOpen: false,

      collapse: true,
    };

    this.timer = null;
  }

  componentDidUpdate = (prevProps) => {
    if (this.props.classes && prevProps.classes !== this.props.classes)
    {
      this.createTooltip(this.props.classes);
    }
  }

  componentWillUnmount = () => {
    if(this.timer){clearInterval(this.timer)}
    //Mobile handler












  }

  getTooltip = (classInput) =>
  {
    return <div className={'classesGrid ' + classInput}>{this.state.tooltip}</div>;
  }

  createTooltip = (classesInfo) => {
    let classButtons = [];

    for (let i = 0; i < classesInfo.length; i++) {
      let _class = classesInfo[i];

      if (this.props.IGNORE_CLASSES.includes(_class.name)) {
        continue;
      }

      let style = {
        color: _class.color
      };

      classButtons.push((
        <Tooltip key={_class.name} placement='bottom' TransitionComponent={Zoom} arrow title={_class.name}>
          <IconButton
            className='tool-button'
            color='secondary'
            onClick={(e) => {this.props.onSubToolbarClick(e, _class)}}
          >
            <CircleIcon style={style}/>
          </IconButton>
        </Tooltip>
      ));
    }

    this.setState({tooltip: classButtons});
  }

  handleTooltipChange = (type, input) => {
    if(this.state.tooltipOpen !== input)
    {
      if (input === false)
      {
        this.setState({tooltipOpen: false})
      }
      else
      {
        this.setState({tooltipOpen: type})
      }
    }
  }

  handleToolbarClick = (input) => {
    this.setState({tooltipOpen: false}, () => {
      this.props.onToolbarClick(input);
    })
  }

  render = () => {
    return (
      <Drawer PaperProps={{className: 'drawerPaper'}} open={!this.state.collapse} className={this.state.collapse ? 'labelToolToolbar' : 'labelToolToolbar toolbarExpanded'} variant='permanent'>
        {/*<div key={!this.state.tooltip ? 'tooltipDefault' : 'tooltipWithClasses'} className='labelToolToolbar'>*/}
          {/*Labeler*/}
          <ToolButton
            tool={this.props.tool}
            collapse={this.state.collapse}
            inputTool='labeler'
            displayName='Pencil'
            onToolbarClick={this.handleToolbarClick}
            icon={<FontAwesomeIcon icon={faPen} />}
            tooltip={true}
            tooltipOpen={this.state.tooltipOpen}
            getTooltip={this.getTooltip}
            handleTooltipChange={this.handleTooltipChange}
            BrushSizeControl={<BrushSizeControl
              changeToolSize={this.props.changeToolSize}
              strokeSize={this.props.strokeSize}
              STROKE_STEP={this.props.STROKE_STEP}
            />}
          />

          {/*Polygon*/}
          <ToolButton
            tool={this.props.tool}
            collapse={this.state.collapse}
            displayName='Shape'
            inputTool='polygon'
            onToolbarClick={this.handleToolbarClick}
            icon={<FontAwesomeIcon icon={faDrawPolygon} />}
            tooltip={true}
            tooltipOpen={this.state.tooltipOpen}
            getTooltip={this.getTooltip}
            handleTooltipChange={this.handleTooltipChange}
          />

          {/*Eraser*/}
          <ToolButton
            tool={this.props.tool}
            collapse={this.state.collapse}
            displayName='Eraser'
            inputTool='eraser'
            onToolbarClick={this.handleToolbarClick}
            icon={<FontAwesomeIcon icon={faEraser} />}
            BrushSizeControl={<BrushSizeControl
              changeToolSize={this.props.changeToolSize}
              strokeSize={this.props.strokeSize}
              STROKE_STEP={this.props.STROKE_STEP}
            />}
          />


          {/*Layer*/}
          <ExpansionPanel className='layersSelector'>
            <ExpansionPanelSummary>
            <div className='toolButtonContainer'>
              <IconButton color='primary' size='small'>
                <LayersIcon />
              </IconButton>
              {this.state.collapse ? null : <button className='toolbarButtonLabel'>Layers</button>}
            </div>

            </ExpansionPanelSummary>
            <ExpansionPanelDetails>
              <LayerToggleButton
                collapse={this.state.collapse}
                onToolbarClick={this.handleToolbarClick}
                displayName='labels'
                status={this.props.hideLabel}
                name='label'
                icon={<LabelIcon />}
              />
              {
                this.props.mask ? <LayerToggleButton
                  collapse={this.state.collapse}
                  onToolbarClick={this.handleToolbarClick}
                  displayName='polygons'
                  status={this.props.hidePolygons}
                  name='polygon'
                  icon={<PolygonsIcon />}
                /> : null
              }
            </ExpansionPanelDetails>
          </ExpansionPanel>

          {/*Zoom*/}
          <ExpansionPanel expanded={false}>
            <ExpansionPanelSummary className='zoom'>

            <div className='toolButtonContainer'>
              <IconButton
                color='primary' size='small'
                onClick={() => {this.props.zoom(-3)}}
              >
                <FontAwesomeIcon icon={faSearchMinus} />
              </IconButton>
              {this.state.collapse ? null : <button onClick={() => {this.props.zoom(-3)}} className='toolbarButtonLabel'>Zoom Out</button>}
            </div>
            <div className='toolButtonContainer'>
              <IconButton
                color='primary' size='small'
                onClick={() => {this.props.zoom(3)}}
              >
                <FontAwesomeIcon icon={faSearchPlus} />
              </IconButton>
              {this.state.collapse ? null : <button onClick={() => {this.props.zoom(3)}} className='toolbarButtonLabel'>Zoom In</button>}
            </div>
            </ExpansionPanelSummary>
          </ExpansionPanel>


          {/*Save*/}
          <ExpansionPanel expanded={false}>
            <ExpansionPanelSummary>
              <div className='toolButtonContainer'>
                <IconButton
                  color='primary' size='small'
                  onClick={() => {this.handleToolbarClick('save')}}
                >
                  <FontAwesomeIcon icon={faSave} />
                </IconButton>
                {this.state.collapse ? null : <button onClick={() => {this.handleToolbarClick('save')}} className='toolbarButtonLabel'>Save</button>}
              </div>
            </ExpansionPanelSummary>
          </ExpansionPanel>

          {/*Collapse*/}
          <ExpansionPanel expanded={false}>
            <ExpansionPanelSummary>
              <div className='toolButtonContainer'>
                <IconButton
                  color='primary' size='small'
                  onClick={() => {this.setState({collapse: !this.state.collapse})}}
                >
                  {this.state.collapse ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                </IconButton>
                {this.state.collapse ? null : <button onClick={() => {this.setState({collapse: !this.state.collapse})}} className='toolbarButtonLabel'>Collapse</button>}
              </div>
            </ExpansionPanelSummary>
          </ExpansionPanel>
        {/*</div>*/}
      </Drawer>
    );
  }
}
export default Toolbar;

class ToolButton extends Component {
  render = () => {
    let el = (<ExpansionPanelSummary>
        <ToolToggleButton
          tool={this.props.tool}
          inputTool={this.props.inputTool}
          onToolbarClick={this.props.onToolbarClick}
          icon={this.props.icon}
          displayName={this.props.displayName}
          collapse={this.props.collapse}
        />
      </ExpansionPanelSummary>);

    let returnEl = this.props.tooltip ? <Tooltip placement='right' open={this.props.tooltipOpen === this.props.inputTool} onClose={() => {this.props.handleTooltipChange(this.props.inputTool, false)}} onOpen={() => {this.props.handleTooltipChange(this.props.inputTool, true)}} TransitionComponent={Zoom} arrow interactive title={this.props.tooltip ? this.props.getTooltip(this.props.inputTool) : 'loading classes'}>{el}</Tooltip>
    : el;

    return (
      <ExpansionPanel expanded={this.props.tool === this.props.inputTool} className={this.props.tool === this.props.inputTool ? 'selected' : ''} key={this.props.inputTool + 'Container_' + toString(this.props.tool === this.props.inputTool)}>
        {returnEl}
        {this.props.BrushSizeControl ? this.props.BrushSizeControl : null}
      </ExpansionPanel>)
  }
}


class ToolToggleButton extends Component {
  render = () => {
    return (
      this.props.tool === this.props.inputTool ?
        <div className='toolButtonContainer'>
          <Zoom in={this.props.tool === this.props.inputTool} key={this.props.inputTool + 'Fab_' + toString(this.props.tool === this.props.inputTool)}>
            <Fab
              color='primary' size='small'
              onClick={() => {this.props.onToolbarClick(this.props.inputTool)}}
            >
              {this.props.icon}
            </Fab>
          </Zoom>
          {this.props.collapse ? null : <button onClick={() => {this.props.onToolbarClick(this.props.inputTool)}} className='toolbarButtonLabel'>{this.props.displayName}</button>}
        </div> :
        <div className='toolButtonContainer'>
          <Zoom in={this.props.tool !== this.props.inputTool} key={this.props.inputTool + 'Icon_' + toString(this.props.tool === this.props.inputTool)}>
            <IconButton
              color='primary' size='small'
              onClick={() => {this.props.onToolbarClick(this.props.inputTool)}}
            >
              {this.props.icon}
            </IconButton>
          </Zoom>
          {this.props.collapse ? null : <button onClick={() => {this.props.onToolbarClick(this.props.inputTool)}} className='toolbarButtonLabel'>{this.props.displayName}</button>}
        </div>
    )
  }
}

class LayerToggleButton extends Component {
  render = () => {
    return (
      !this.props.status ?
      <div className='toolButtonContainer'>
        <Zoom in={!this.props.status} key={'hide_' + this.props.name + '_Fab_' + toString(this.props.status)}>
          <Fab
            color='primary' size='small'
            onClick={() => {this.props.onToolbarClick('toggle-'+ this.props.name +'-layer')}}
            disabled={this.props.disabled ? true : false}
          >
            {this.props.icon}
          </Fab>
        </Zoom>
        {this.props.collapse ? null : <button onClick={() => {this.props.onToolbarClick('toggle-'+ this.props.name +'-layer')}} className='toolbarButtonLabel'>{this.props.displayName}</button>}
      </div> :
      <div className='toolButtonContainer'>
        <Zoom in={this.props.status} key={'hide_' + this.props.name + 'Icon_' + toString(this.props.status)}>
          <IconButton
            color='primary' size='small'
            onClick={() => {this.props.onToolbarClick('toggle-'+ this.props.name +'-layer')}}
            disabled={this.props.disabled ? true : false}
          >
            {this.props.icon}
          </IconButton>
        </Zoom>
        {this.props.collapse ? null : <button onClick={() => {this.props.onToolbarClick('toggle-'+ this.props.name +'-layer')}} className='toolbarButtonLabel'>{this.props.displayName}</button>}
      </div>
    )
  }
}

class BrushSizeControl extends Component {
  render()
  {
    return (
      <ExpansionPanelDetails className='brushSize'>
      <IconButton
        color='primary' size='small'
        onClick={() => {this.props.changeToolSize(-this.props.STROKE_STEP * 5)}}
      >
        <FontAwesomeIcon icon={faMinus} />
      </IconButton>
      <span className='size'>{this.props.strokeSize}</span>
      <IconButton
        color='primary' size='small'
        onClick={() => {this.props.changeToolSize(this.props.STROKE_STEP * 5)}}
      >
        <FontAwesomeIcon icon={faPlus} />
      </IconButton>
    </ExpansionPanelDetails>)
  }
}