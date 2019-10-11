import React, { PureComponent } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  IconButton
} from '@material-ui/core';
import InfoIcon from '@material-ui/icons/Info';
import ClearIcon from '@material-ui/icons/Clear';

import Info from './Info';
import './LayerInfo.css';


export default class LayerInfoButton extends PureComponent {
  constructor(props, context) {
    super(props, context);
    this.state = {
      content: [],
    };
  }

  clickHandle = () => {
    this.props.getLayerInfoContent({content: this.state.content, random: Math.random()});
  }

  componentWillMount = () => {
    let info = Info[this.props.id];
    if(info)
    {
      let content = [];
      content.push(<h1 key={'heading_' + this.props.id}>{info.title}</h1>);

      for (let i = 0; i < info.text.length; i++)
      {
        let text = info.text[i];
        if (text.type)
        {
          content.push(<a href={text.content} target="_blanc" key={this.props.id + '_link_' + i}>{text.content}</a>);
        }
        else
        {
          content.push(<p key={this.props.id + '_paragraph_' + i}>{text.content}</p>);
        }
      }

      this.setState({content: content});
    }
  }

  render = () => {
    return (this.state.content.length > 0 ?
      <div className='LayerInfoButton'>
        <IconButton onClick={this.clickHandle}><InfoIcon /></IconButton>
    </div> : null);
  }
}

export class LayerInfoCard extends PureComponent {
  constructor(props, context) {
    super(props, context);
    this.state = {
      content: [],
      hidden: true
    };
  }

  componentDidUpdate = (prevProps) => {
    if (prevProps.content !== this.props.content)
    {
      this.props.closePanes('info');
      this.setState({content: this.props.content, hidden: false});
      if (this.props.isMobile)
      {
        this.props.openPane(this.props.paneName, true)
      }
    }

    if (prevProps.random !== this.props.random)
    {
      this.props.closePanes('info');
      this.setState({hidden: false})
      if (this.props.isMobile)
      {
        this.props.openPane(this.props.paneName, true)
      }
    }
  }

  onCloseClick = () => {
    this.setState({hidden: true})
  }

  render = () => {
    let title = '';
    let content = [];

    for (let i = 0; i < this.state.content.length; i++)
    {
      if (i === 0)
      {
        title = this.state.content[i];
      }
      else
      {
        content.push(this.state.content[i]);
      }
    }

    return (<Card className={this.state.hidden ? 'layerInfoCard hidden' : 'layerInfoCard'}>
        <CardHeader
          className='material-card-header'
          title={title}
          action={
            <div>
              <IconButton
                onClick={this.onCloseClick}
                aria-label='Close'
              >
                <ClearIcon />
              </IconButton>
            </div>
          }
        />
        <CardContent className={'card-content'}>
          {content}
        </CardContent>
      </Card>
    );
  }
}