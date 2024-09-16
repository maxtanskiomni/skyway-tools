import makeStyles from '@mui/styles/makeStyles';
import { red } from '@mui/material/colors';

const useStyles = makeStyles((theme) => ({
    root: {
      width: '100%',
      maxWidth: 360,
      backgroundColor: theme.palette.background.paper,
    },
    card_root: {
      width: '100%',
      maxHeight: 350,
      maxWidth: 360,
      backgroundColor: theme.palette.background.paper,
      margin: "auto",
      marginBottom: 5,
    },
    card_small_root: {
      width: '100%',
      maxHeight: 150,
      width: 350,
      backgroundColor: theme.palette.background.paper,
      margin: "auto",
      marginBottom: 10,
    },
    cardHeaderContent: {
      overflow: "hidden",
      padding: 8,
    },
    paper: {
      width: '80%',
      maxHeight: 435,
    },
    subtitle:{
      textAlign: 'left',
      fontWeight: 800,
    },
    body_left:{
      textAlign: 'left',
      fontWeight: 400,
    },
    media: {
      height: 0,
      paddingTop: '56.25%', // 16:9
    },
    expand: {
      transform: 'rotate(0deg)',
      marginLeft: 'auto',
      transition: theme.transitions.create('transform', {
        duration: theme.transitions.duration.shortest,
      }),
    },
    expand_no_padding: {
      transform: 'rotate(0deg)',
      transition: theme.transitions.create('transform', {
        duration: theme.transitions.duration.shortest,
      }),
    },
    expandOpen: {
      transform: 'rotate(180deg)',
    },
    avatar: {
      backgroundColor: red[500],
    },
    largeAvatar:{
      width: theme.spacing(8),
      height: theme.spacing(8),
      marginLeft: 10
    },
    dialog: {
      minWidth: 360,
    },
    listItem: {
      padding: theme.spacing(1, 0),
    },
    total: {
      fontWeight: 700,
    },
    title: {
      marginTop: theme.spacing(2),
    },
}));

export default useStyles;
