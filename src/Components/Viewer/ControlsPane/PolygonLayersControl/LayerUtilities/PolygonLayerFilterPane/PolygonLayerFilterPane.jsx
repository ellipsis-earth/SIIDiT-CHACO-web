import React, { Component } from 'react';

import Collapse from '@material-ui/core/Collapse';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import InputLabel from '@material-ui/core/InputLabel';
import FormControl from '@material-ui/core/FormControl';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import ListItemText from '@material-ui/core/ListItemText';
import MenuItem from '@material-ui/core/MenuItem';
import Select from '@material-ui/core/Select';
import TextField from '@material-ui/core/TextField';

import CheckIcon from '@material-ui/icons/Check';
import ClearIcon from '@material-ui/icons/Clear';
import DeleteIcon from '@material-ui/icons/Delete';

import './PolygonLayerFilterPane.css';

class PolygonLayerFilterPane extends Component {
	constructor(props, context) {
    super(props, context);

    this.state = {
    	filterOptions: []
    };
  }

  handleDelete = (i) => {
  	let filterOptions = this.state.filterOptions;

  	filterOptions.splice(i, 1);

  	this.setState(filterOptions, () => {
  		this.props.filter({id: this.props.layer.id, filter: this.state.filterOptions});
  	});
  }

  handleAdd = () => {
  	this.setState({add: !this.state.add})
  }

  handleConfirm = (input) => {
  	let filterOptions = this.state.filterOptions;

  	filterOptions.push(input);

  	this.setState(filterOptions, () => {
  		this.props.filter({id: this.props.layer.id, filter: this.state.filterOptions});
  	});
  }

  handleDeny = () => {
  	this.setState({add: false})
  }

	render = () => {
		if(this.props.filterOpen)
		{
			console.log(this.props);
		}

		return (
      <Collapse in={this.props.filterOpen} className='polygonLayerFilterPane filterCollapse'>
      	<List dense>
      		{
      			this.state.filterOptions.map((x, i) => {
      				return (<ListItem key={'polygonLayerFilterItem_' + x.key + i}>
		      			<ListItemText primary={Object.values(x).join(' ')}/>
		      			<ListItemSecondaryAction>
		      				<IconButton edge='end' onClick={() => {this.handleDelete(i)}}>
		      					<DeleteIcon />
		      				</IconButton>
		      			</ListItemSecondaryAction>
		      		</ListItem>)
						})
      		}
    			<Collapse in={this.state.add}>
    				<List dense>
    					<PolygonLayerFilterInput
    						layer={this.props.layer}
    						handleConfirm={this.handleConfirm}
    						handleDeny={this.handleDeny}
  						/>
	    			</List>
      		</Collapse>
      		<Collapse in={!this.state.add}>
		      	<ListItem>
		      		<ListItemText className='addListOption' onClick={this.handleAdd}>+ add filter</ListItemText>
		    		</ListItem>
	    		</Collapse>
      	</List>
    	</Collapse>
  	)
	}
}

export default PolygonLayerFilterPane;

class PolygonLayerFilterInput extends Component {
	constructor(props, context) {
    super(props, context);

    this.state = {
    	key: '',
    	operator: '',
    	value: '',
    };
  }

  handleChange = (e, type) => {
  	let stateObj = {};

  	if(type === 'value')
  	{
  		let number = Number(e.target.value);
  		if(!isNaN(number))
  		{
  			stateObj[type] = number;
  		}
  		else
  		{
  			stateObj[type] = e.target.value;
  		}
  	}
  	else
  	{
			stateObj[type] = e.target.value;
  	}


  	this.setState(stateObj);
  }

  handleConfirm = () => {
  	this.props.handleConfirm(this.state);
  	this.handleDeny();
  }

  handleDeny = () => {
  	this.setState({
    	key: '',
    	operator: '',
    	value: '',
    },
    () => {
  		this.props.handleDeny();
    });
  }

	render = () =>
	{
		let operators = ['=', '>', '<', '<=', '>=', '!='];
		let inputId = this.props.layer.name.replace(' ', '_');

		return ([<ListItem key={'input' + inputId}>
      <Grid
			  container
			  direction="row"
			  justify="center"
			  alignItems="center"
			  spacing={1}
			>
				<Grid item xs={4}>
				  <FormControl required key={'keyInput' + inputId} fullWidth>
		        <InputLabel shrink={true} id={'keyInput' + inputId}>Property</InputLabel>
		        <Select
		          labelId={'keyInput' + inputId}
		          value={this.state.key}
		          onChange={(e) => {this.handleChange(e, 'key')}}
		          fullWidth
		        >
		        	{
		        		this.props.layer.properties.map(x => {
		        			return(<MenuItem key={inputId + '_keyInput_' + x} value={x}>{x}</MenuItem>)
		        		})
		        	}
		        </Select>
		      </FormControl>
	      </Grid>
	      <Grid item xs={4}>
		      <FormControl required key={'operatorInput' + inputId} fullWidth>
		        <InputLabel shrink={true} id={'operatorInput' + inputId}>Operator</InputLabel>
		        <Select
		          labelId={'operatorInput' + inputId}
		          value={this.state.operator}
		          onChange={(e) => {this.handleChange(e, 'operator')}}
		          fullWidth
		        >
		        	{
		        		operators.map(x => {
		        			let value = x.replace(' ', '');
		        			return(<MenuItem key={inputId + '_operatorInput_' + x} value={value}>{value}</MenuItem>)
		        		})
		        	}
		        </Select>
		      </FormControl>
	      </Grid>
	      <Grid item xs={4}>
		      <TextField
		      	required
		      	label="Value"
		      	onChange={(e) => {this.handleChange(e, 'value')}}
		      	key={'valueInput' + inputId}
		      	InputLabelProps={{ shrink: true }}
		      	fullWidth
		    	/>
	    	</Grid>
	  	</Grid>
  	</ListItem>,
  	<ListItem className='filterAddHandlingButtonsContainer' key={'buttons' + inputId}>
			<IconButton
				color='primary'
				className='confirmButton'
				onClick={this.handleConfirm}
			>
				<CheckIcon />
			</IconButton>
			<IconButton onClick={this.handleDeny}>
					<ClearIcon />
				</IconButton>
		</ListItem>])
	}
}
