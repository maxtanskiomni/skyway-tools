import React from 'react';

import data from '../config.js';
import useStyles from '../utilities/styles.js';

import CollapseList from './CollapseList.js';

import clsx from 'clsx';
import Card from '@mui/material/Card';
import CardHeader from '@mui/material/CardHeader';
import CardMedia from '@mui/material/CardMedia';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Collapse from '@mui/material/Collapse';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';
// import FavoriteIcon from '@mui/icons-material/Favorite';
// import ShareIcon from '@mui/icons-material/Share';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
// import MoreVertIcon from '@mui/icons-material/MoreVert';

import { red } from '@mui/material/colors';


export default function Card1(props) {
    //Card component
    const classes = useStyles();
    const [expanded, setExpanded] = React.useState(false);
    const handleExpandClick = () => {
      setExpanded(!expanded);
    };
  
    const taskLists = data.taskLists;
  
    return (
      <Card className={classes.root}>
      <CardHeader
        avatar={
          <Avatar aria-label="recipe" className={classes.avatar} style={{backgroundColor: red[500]}}>
            F
          </Avatar>
        }
        action={
          <IconButton
            className={clsx(classes.expand, {
              [classes.expandOpen]: expanded,
            })}
            onClick={handleExpandClick}
            aria-expanded={expanded}
            aria-label="show more"
            size="large">
            <ExpandMoreIcon />
          </IconButton>
        }
        title={props.title}
        subheader="Updated 5/15/2021"
      />
      <Collapse in={expanded} timeout="auto">
        <CardContent>
  {
    // <Typography paragraph>Method:</Typography>
    //       <Typography paragraph>
    //         Heat 1/2 cup of the broth in a pot until simmering, add saffron and set aside for 10
    //         minutes.
    //       </Typography>
  }
  
          {
            taskLists.map(list => <CollapseList list={list}/>)
          }
        </CardContent>
      </Collapse>
    </Card>
    );
  };