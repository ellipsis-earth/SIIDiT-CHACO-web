import React, { PureComponent } from 'react';

import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardHeader from '@material-ui/core/CardHeader';
import IconButton from '@material-ui/core/IconButton';

import InfoIcon from '@material-ui/icons/Info';
import ClearIcon from '@material-ui/icons/Clear';

import Info from './Info';
import './LayerInfo.css';


export default class LayerInfoButton extends PureComponent {
  constructor(props, context) {
    super(props, context);
    this.state = {
      content: [],
      open: false,
    };
  }

  clickHandle = () => {
    this.setState({open: !this.state.open}, () => {
      this.props.setLayerInfoContent({content: this.state.content, contentId: this.props.id, open: this.state.open});
    })
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
      <IconButton onClick={this.clickHandle} edge='end'>
        <InfoIcon fontSize="small" />
      </IconButton> : null
    );
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
    if (prevProps.content !== this.props.content || prevProps.contentId !== this.props.contentId)
    {
      this.openPane();
    }

    if (prevProps.open !== this.props.open && this.props.open === false)
    {
      this.onCloseClick();
    }
    else if (prevProps.open !== this.props.open && this.props.open === true)
    {
      this.openPane();
    }
  }

  openPane = () => {
    this.props.closePanes('info');
    this.setState({content: this.props.content, hidden: false});
    if (this.props.isMobile)
    {
      this.props.openPane(this.props.paneName, true)
    }
  }

  onCloseClick = () => {
    this.setState({hidden: true})
  }

  render = () => {
    console.log(this.props.contentId);

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
            <IconButton
              onClick={this.onCloseClick}
              aria-label='Close'
            >
              <ClearIcon />
            </IconButton>
          }
        />
        <CardContent className={'card-content'}>
          {content}
        </CardContent>
      </Card>
    );
  }
}