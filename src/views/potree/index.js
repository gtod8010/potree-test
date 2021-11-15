import React, { useState, useEffect } from 'react';
// import { useSelector } from 'react-redux';
import {
    Container,
    makeStyles
} from '@material-ui/core';
import Page from '../../components/Page'
import PotreeViewer from './PotreeViewer';
// import axios from 'src/utils/Rest';

import "./css/potree/potree.css";
import "./css/jquery-ui/jquery-ui.min.css";
// import "./css/openlayers3/ol.css";
import "./css/spectrum/spectrum.css";
// import "./css/jstree/themes/mixed/style.css";

const useStyles = makeStyles((theme) => ({
    root: {
        backgroundColor: theme.palette.background.dark,
        minHeight: '100%',
        paddingBottom: theme.spacing(3),
        paddingTop: theme.spacing(3)
    }
}));


const Admin = () => {
    const [pair, setPair] = useState(null);
    const [notePoint, setNotePoint] = useState([]);
    // const role = useSelector(state=>state.user.role);
    const classes = useStyles();


    const style = {
        position: "relative"
    }

    return (
        <Page
            className={classes.root}
            title="Potree"
            style={style}
        >
            <Container maxWidth="lg">
                <PotreeViewer/>
            </Container>
        </Page>
    );
};

export default Admin;