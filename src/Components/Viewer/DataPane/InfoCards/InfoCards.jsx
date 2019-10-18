import React, { PureComponent } from 'react';
import Text from './Text';

import {
  Card,
  Checkbox,
  CardHeader,
  CardContent,
  Collapse,
  IconButton,
  Typography
} from '@material-ui/core';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

import './InfoCards.css';

class InfoCards extends PureComponent {
  constructor(props, context) {
    super(props, context);

    this.state = {
      open: {},
      infoCards: [],
    };
  }

  onExpandClick = (title) =>
  {
    let openObj = this.state.open;

    openObj[title] = !openObj[title];

    this.setState({openObj: openObj}, this.createCards());
  }

  createCards = () =>{
    let infoCards = [];
    let openObj = this.state.open;

    for (let i = 0; i < Text.length; i++)
    {
      let open = typeof openObj[Text[i].title] !== 'undefined' ? openObj[Text[i].title] : Text[i].defaultOpen;

      let text = [];
      for (var j = 0; j < Text[i].text.length; j++)
      {
        if (Text[i].text[j].type && Text[i].text[j].type === 'link')
        {
          text.push(<a key={Text[i].title + '_link_' + j} href={Text[i].text[j].url} target="_blank">{Text[i].text[j].url}</a>);
        }
        else
        {
          text.push(<p key={Text[i].title + '_paragraph_' + j}>{Text[i].text[j]}</p>);
        }
      }

      infoCards.push(<InfoCard title={Text[i].title} text={text} open={open} onExpandClick={this.onExpandClick} key={Text[i].title + '_' + open}/>);
      openObj[Text[i].title] = open;
    }

    this.setState({infoCards: infoCards, open: openObj});
  }

  componentWillMount = () => {
    this.createCards();
  }

  render = () => {
    return this.state.infoCards
  }
}

class InfoCard extends PureComponent {
  constructor(props, context) {
    super(props, context);
  }

  render () {
    return(
      <Card className='data-pane-card InfoCard'>
        <CardHeader
          className='material-card-header'
          title={
            <Typography gutterBottom variant="h6" component="h2">
              {this.props.title}
            </Typography>
          }
          action={
            <IconButton
              className={this.props.open ? 'expand-icon expanded' : 'expand-icon'}
              onClick={() => this.props.onExpandClick(this.props.title)}
              aria-expanded={this.props.open}
              aria-label='Show'
            >
              <ExpandMoreIcon />
            </IconButton>
          }
        />
        <Collapse in={this.props.open}>
          <CardContent className={'card-content'} >
            { this.props.text }
          </CardContent>
        </Collapse>
      </Card>
    )
  }
}

export default InfoCards;