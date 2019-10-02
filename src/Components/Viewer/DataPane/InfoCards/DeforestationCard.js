import React, { PureComponent } from 'react';

import ApiManager from '../../../../ApiManager';

import {
  Card,
  CardHeader,
  CardActions,
  Collapse,
  Typography,
  Button,
  IconButton,
  CardContent,
  CircularProgress
} from '@material-ui/core';

import ExpandMoreIcon from '@material-ui/icons/ExpandMore';


class DeforestationCard extends PureComponent {
  constructor(props, context) {
    super(props, context);
    this.state = {
      filterData: {},
      totalsOpen: false,
      content: [],
    }
  }

  prepareFilterData = async (map, layers) => {
    let layerIdFilter = {}
    let total = {};

    for (let i = 0; i < layers.length; i++)
    {
      let loopBool = true;
      let results = [];

      let body = {
        mapId: map.id,
        page: 1,
        filters: {forms: map.forms.filter((form) => {return form.uuid === layers[i].formID}).map(x => x.formName), types: layers[i].types}
      }

      while(loopBool)
      {
        let formPromises = [];

        for (let j = 0; j < 5; j++)
        {
          formPromises.push(ApiManager.post('/geoMessage/feed', body, this.props.user));
          body.page = body.page + 1;
        }

        let filtered = await Promise.all(formPromises);

        if (filtered[filtered.length - 1].length < 100)
        {
          loopBool = false;
        }

        results.push(...[].concat(...filtered))
      }

      for (let k = 0; k < results.length; k++)
      {
        let element = results[k];
        Array.isArray(layerIdFilter[element.type]) ? layerIdFilter[element.type].push(element.elementId) : layerIdFilter[element.type] = [element.elementId]
        total[layers[i].name] = total[layers[i].name] ? total[layers[i].name] + element.form.answers[0].answer : element.form.answers[0].answer;
        if(k === results.length - 1)
        {
          total[layers[i].name] = total[layers[i].name].toFixed(2);
        }
      }
    }

    this.prepareTotalsCard({ids: layerIdFilter, totals: total});
  }

  prepareTotalsCard = (filterData) => {
    let content = [];

    if (filterData)
    {
      let totals = filterData.totals;
      

      for(let key in totals)
      {
        content.push(<p key={key}>{key}: {totals[key]}</p>)
      }
    }

    return this.setState({content: content});
  }

  componentDidMount = () => {
    let filterData = this.prepareFilterData(this.props.map, [
      {
        name: 'deforestation',
        layerID: 'b4cfa212-9547-4d43-9119-1db5482954a3',
        formID: '5fd5ebe0-9d02-11e9-baf8-42010a840021',
        types: ['standard_tile'],
      }, 
      {
        name: 'lack of forest',
        layerID: "647c9802-f136-4029-aa6d-884396be4e9b",
        formID: '0ef01ab2-9d01-11e9-baf8-42010a840021',
        types: ['polygon'],
      }
    ]);
  }

  render = () => {
    return (
      <Card className='data-pane-card TotalsCard' key={'deforestation' + this.state.totalsOpen}>
        <CardHeader
          className='material-card-header'
          title={
            <Typography gutterBottom variant="h6" component="h2">
              {'Deforestation'}
            </Typography>
          }
          action={
            <IconButton
              className={this.state.totalsOpen ? 'expand-icon expanded' : 'expand-icon'}
              onClick={() => {this.setState({totalsOpen: !this.state.totalsOpen})}}
              aria-expanded={this.props.open}
              aria-label='Show'
            >
              <ExpandMoreIcon />
            </IconButton>
          }
        />
        <Collapse in={this.state.totalsOpen}>
          <CardContent className={'card-content'} >
            {this.state.content.length > 0 ? this.state.content : <CircularProgress className='loading-spinner'/>}
          </CardContent>
        </Collapse>
      </Card>
    );
  }
}

export default DeforestationCard;