// import Marker from './marker';
// import NotePoint from './notePoint';
import Observer from './observer';
// import Arrow from './arrow';
import * as Potree from '../draw/potree';

const REF_MARKER_COLOR = "#7cff00";
const TAR_MARKER_COLOR = "red";

// OBSERVER EVENT NAME
const CREATE_MARKER = "create_marker";
const MOVE_MARKER = "move_marker";
const SET_MARKER_VISIBLE = "set_marker_visible";
const SET_MARKER_INDEX = "set_marker_index";
const REMOVE_MARKER = "remove_marker";

const SET_TARGET_VISIBLE = "set_target_visible";
const SET_REFERENCE_VISIBLE = "set_reference_visible";
const SET_NOTEPOINT_VISIBLE = "set_notepoint_visible";
const SET_ALIGNED_VISIBLE = "set_aligned_visible";
const SET_POINT_SIZE = "set_point_size";
const SET_INTENSITY_RANGE = "set_intensity_range";
const REMOVE_REFERENCE = "remove_reference";
const REMOVE_TARGET = "remove_target";
const REMOVE_ALIGNED = "remove_aligned";
const REMOVE_NOTEPOINT = "remove_notepoint";

const CREATE_NOTEPOINT = "create_note_point"
const NOTEPOINT_COLOR = "#CCFF00";


const MOVE_ARROW = "move_arrow";
const REMOVE_ARROW = "remove_arrow";
const CREATE_ARROW = "create_arrow_helper"
const SET_ARROW_VISIBLE = "set_arrow_visible";

// PM2 환경변수
// const FILE_SERVER_ADDRESS = process.env.REACT_APP_FILE_SERVER_HOST + process.env.REACT_APP_FILE_SERVER_PORT;
const FILE_SERVER_ADDRESS ='http://data.stryx.co.kr:10415'


const pointSizeOnSession = window.localStorage.getItem("point-size");
const intensityRangeOnSession = window.localStorage.getItem("intensity-range");
export const DEFAULT_POINT_SIZE = pointSizeOnSession ? pointSizeOnSession : 2;
export const DEFAULT_INTENSITY_RANGE = intensityRangeOnSession ? intensityRangeOnSession : 30;

const REF_MAT_STYLE = {
    activeAttributeName: "intensity gradient",
    intensityGamma: 0,
    intensityBrightness: 1.0,
    intensityContrast: 1.0,
    intensityRange: [DEFAULT_INTENSITY_RANGE,255],
    size: DEFAULT_POINT_SIZE
};
const TAR_MAT_STYLE = {
    activeAttributeName: "intensity",
    intensityGamma: 0,
    intensityBrightness: 0,
    intensityContrast: 0,
    intensityRange: [DEFAULT_INTENSITY_RANGE,255],
    size: DEFAULT_POINT_SIZE
};
export const SNAP = {
    TARGET: 0,
    REFERENCE: 1,
    ALIGNED: 2,
    NOTEPOINT:3
}
// example of using VISIBILITY => VISIBILITY[SNAP.TARGET] = true;
//                         tar  , ref , aligned
export const VISIBILITY = [false, true, false]

export const observer = new Observer();

//default observer events
export const init = () => {
    observer.regist(CREATE_MARKER, createMarkerEvent);
    observer.regist(CREATE_NOTEPOINT, createNotePointEvent);
    observer.regist(CREATE_ARROW,createArrowEvent);
}

export const reset = () => {
    observer.reset();
    init();
}

///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////  POINT CLOUD  /////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
export const drawArrowHelper = (x,y,z,color) => {
    //배열로 받아옴 x,y,z
    let xArrowId = Potree.addArrowX(x,y,z,3,'red');
    let yArrowId = Potree.addArrowY(x,y,z,3,'blue');
    let zArrowId = Potree.addArrowZ(x,y,z,3);
    
    let setVisibleEventHandler = (visible) => {
        Potree.setArrowVisible(xArrowId, visible);
        Potree.setArrowVisible(yArrowId, visible);
        Potree.setArrowVisible(zArrowId, visible);
    };
}

export const drawSnap = async (snap, type) => {
    console.log("Try drawing snap", snap, type);

    let event = {},
        style,
        potreePaths;

    switch(type) {
        case SNAP.REFERENCE:
            event.visible = SET_REFERENCE_VISIBLE;
            event.remove = REMOVE_REFERENCE;
            style = REF_MAT_STYLE;
            potreePaths = snap.lasPath.map(el=>{
                let path = el.substring(0,el.lastIndexOf(".")).replace("separated_las","separated_potree"),
                    subpath = path.replaceAll("\\","/");
                return FILE_SERVER_ADDRESS+subpath;
            });
            break;
        case SNAP.TARGET:
            event.visible = SET_TARGET_VISIBLE;
            event.remove = REMOVE_TARGET;
            style = TAR_MAT_STYLE;
            potreePaths = snap.lasPath.map(el=>{
                let path = el.substring(0,el.lastIndexOf(".")).replace("separated_las","separated_potree"),
                    subpath = path.replaceAll("\\","/");
                return FILE_SERVER_ADDRESS+subpath;
            });
            break;
        case SNAP.ALIGNED:
            if (!snap.alignedPotree) {
                console.log("snap has no aligned las files.", snap);
                return;
            }
            event.visible =SET_ALIGNED_VISIBLE;
            event.remove = REMOVE_ALIGNED;
            style = TAR_MAT_STYLE;
            potreePaths = snap.alignedPotree.map(el=>{
                let subpath = el.replaceAll("\\","/");
                return FILE_SERVER_ADDRESS+subpath;
            });
            break;
        case SNAP.NOTEPOINT:
            event.visible = SET_NOTEPOINT_VISIBLE;
            event.remove = REMOVE_NOTEPOINT;
            style = REF_MAT_STYLE;
            // potreePaths = snap.lasPath.map(el=>{
            //     let path = el.substring(0,el.lastIndexOf(".")).replace("separated_las","separated_potree"),
            //         subpath = path.replaceAll("\\","/");
            //     return FILE_SERVER_ADDRESS+":"+FILE_SERVER_PORT+subpath;
            // });
            return;
            break;
        default:
            console.log("Wrong type of snap.");
            return;
    }

    for (let i = 0; i < potreePaths.length; i++) {
        let path = potreePaths[i] + "/cloud.js",
            name = type+"_"+potreePaths[i].substring(potreePaths[i].lastIndexOf("/")+1),
            lasIdx = Number(name.match(/\[(\d*)\]/)[1]);
        let pointcloud =  await Potree.addPointCloud(path, name, style);

        pointcloud.lasIdx = lasIdx;
        pointcloud.isRef = type;
        pointcloud.visible = VISIBILITY[type];

        let setVisibleEventHandler = (visible) => {
            Potree.setPointCloudVisible(pointcloud.uuid, visible);
        };
        let setPointSizeHandler = (size)=>{
            Potree.setPointCloudMaterialConfig(pointcloud.uuid, {size: size});
        };
        let setIntesityRangeHandler = (range)=>{
            Potree.setPointCloudMaterialConfig(pointcloud.uuid,{intensityRange:[range,255]});
        };

        observer.regist(event.visible,setVisibleEventHandler);
        observer.regist(SET_POINT_SIZE,setPointSizeHandler);
        observer.regist(SET_INTENSITY_RANGE,setIntesityRangeHandler);

        observer.once(event.remove,()=>{
            Potree.setPointCloudVisible(pointcloud.uuid, false);
            Potree.removePointCloud(pointcloud.uuid);
            observer.unregist(event.visible,setVisibleEventHandler);
            observer.unregist(SET_POINT_SIZE,setPointSizeHandler);
            observer.unregist(SET_INTENSITY_RANGE,setIntesityRangeHandler);
        });
    }
}

export const removeAligned = () => {
    observer.notify(REMOVE_ALIGNED);
}

export const updateSnapVisibility = () => {
    observer.notify(SET_TARGET_VISIBLE, VISIBILITY[SNAP.TARGET]);
    observer.notify(SET_REFERENCE_VISIBLE, VISIBILITY[SNAP.REFERENCE]);
    observer.notify(SET_ALIGNED_VISIBLE, VISIBILITY[SNAP.ALIGNED]);
    observer.notify(SET_NOTEPOINT_VISIBLE, VISIBILITY[SNAP.NOTEPOINT]);


}

export const setPointSize = (size) => {
    REF_MAT_STYLE.size = size;
    TAR_MAT_STYLE.size = size;
    observer.notify(SET_POINT_SIZE, size);
}

export const setIntensityRange = (range) => {
    REF_MAT_STYLE.intensityRange = [range,255];
    TAR_MAT_STYLE.intensityRange = [range,255];
    observer.notify(SET_INTENSITY_RANGE, range);
}

///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
/////////////////////////////////////////  MARKER  ////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////

// export const createMarkpair= () => {
//     if (Object.keys(observer.handlers).length === 0) {
//         observer.regist(CREATE_MARKER, createMarkerEvent);
//     }

//     let pair = new Markpair();

//     // ADD MARKER METHOD
//     pair.reference.editPoint = data => {
//         pair.reference.lasIdx = data.lasIdx;
//         pair.reference.pointIdx = data.pointIdx;
//         pair.reference.position = data.position;
//         pair.reference.pointcloudName = data.pointcloudName;
//         observer.notify(MOVE_MARKER + pair.reference.uuid);
//     }

//     pair.target.editPoint = data => {
//         pair.target.lasIdx = data.lasIdx;
//         pair.target.pointIdx = data.pointIdx;
//         pair.target.position = data.position;
//         pair.target.pointcloudName = data.pointcloudName;
//         observer.notify(MOVE_MARKER + pair.target.uuid);
//     }


//     // ADD MARKPAIR METHOD
//     pair.parseRef = data => {
//         pair.reference.parse(data);
//         pair.target.id = pair.reference.pairMarkerId;
//         pair.target.pairMarkerId = pair.reference.id;
//         observer.notify(MOVE_MARKER + pair.reference.uuid);
//     };

//     pair.parseTar = data => {
//         pair.target.parse(data);
//         pair.reference.id = pair.target.pairMarkerId;
//         pair.reference.pairMarkerId = pair.target.id;
//         observer.notify(MOVE_MARKER + pair.target.uuid);
//     };

//     pair.setIdx = idx => {
//         pair.reference.idx = idx;
//         pair.target.idx = idx;
//         pair.idx = idx;
//         observer.notify(SET_MARKER_INDEX + pair.reference.uuid);
//         observer.notify(SET_MARKER_INDEX + pair.target.uuid);
//     }

//     pair.remove = () => {
//         observer.notify(REMOVE_MARKER + pair.reference.uuid);
//         observer.notify(REMOVE_MARKER + pair.target.uuid);
//     }

//     return pair;
// }
// export const createArrowHelper =() =>{
//     if (Object.keys(observer.handlers).length === 0) {
//         observer.regist(CREATE_ARROW, createMarkerEvent);
//     }

//     let arrow = new Arrow();

//     // ADD MARKER METHOD
//     arrow.reference.editPoint = data => {
//         arrow.position = data.position;
//         arrow.reference.pointcloudName = data.pointcloudName;
//         observer.notify(MOVE_MARKER + arrow.reference.uuid);
//     }
//     return arrow;
// }
export const createNotePoint= () => {
    if (Object.keys(observer.handlers).length === 0) {
        observer.regist(CREATE_NOTEPOINT, createNotePointEvent);
    }

    let notePoint = new Point();

    // ADD MARKER METHOD
    notePoint.editPoint = data => {
        notePoint.pointIdx = data.pointIdx;
        notePoint.position = data.position;
        notePoint.pointcloudName = data.pointcloudName;
        notePoint.value.position= data.position;
        notePoint.value.pointIdx = data.pointIdx;
        notePoint.value.lasIdx = data.lasIdx;

        observer.notify(MOVE_MARKER + notePoint.value.uuid);
    }
    // // ADD MARKPAIR METHOD
    notePoint.parseNotePoint = data => {
        notePoint.value.parse(data);
        // pair.target.id = pair.reference.pairMarkerId;
        // pair.target.pairMarkerId = pair.reference.id;
        observer.notify(MOVE_MARKER + notePoint.value.uuid);
    };

    notePoint.setIdx = idx => {
        notePoint.idx = idx;
        observer.notify(SET_MARKER_INDEX + notePoint.value.uuid);
    }

    notePoint.remove = () => {
        observer.notify(REMOVE_MARKER + notePoint.value.uuid);
    }

    return notePoint;
}
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////  UNEXPORTED FUNCTIONS  ////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////

const createMarkerEvent = marker => {
    let position = marker.position,
        color = marker.isRef ? REF_MARKER_COLOR : TAR_MARKER_COLOR,
        text = marker.isRef ? "R" : "T";            

    let sphereId = Potree.addSphere(position, color),
        annotationId = Potree.addAnnotation(position, text+marker.idx);
    
    Potree.setSphereVisible(sphereId, VISIBILITY[marker.isRef]);
    Potree.setAnnotationVisible(annotationId, VISIBILITY[marker.isRef]);

    //marker move event
    let mmid = observer.regist(MOVE_MARKER + marker.uuid,()=>{
        let pos = marker.position;
        Potree.moveSphere(sphereId, pos);
        Potree.moveAnnotation(annotationId, pos);
    });

    let smiid = observer.regist(SET_MARKER_INDEX + marker.uuid,()=>{
        Potree.setAnnotationTitle(annotationId, text+marker.idx);
    })

    //visibility change event
    let setVisibleEventName = marker.isRef ? SET_REFERENCE_VISIBLE : SET_TARGET_VISIBLE;
    let sveid = observer.regist(setVisibleEventName,(visible)=>{
        Potree.setSphereVisible(sphereId, visible);
        Potree.setAnnotationVisible(annotationId, visible);
    });

    //remove event
    observer.once(REMOVE_MARKER + marker.uuid,()=>{
        Potree.removeSphere(sphereId);
        Potree.removeAnnotation(annotationId);

        observer.unregistById(mmid);
        observer.unregistById(smiid);
        observer.unregistById(sveid);
    });
}

const createNotePointEvent = point => {
    let position = point.position,
        color = NOTEPOINT_COLOR,
        text = 'notePoint';

    let sphereId = Potree.addSphere(position, color),
        annotationId = Potree.addAnnotation(position, text);
    
    Potree.setSphereVisible(sphereId, VISIBILITY[point.isRef]);
    Potree.setAnnotationVisible(annotationId, VISIBILITY[point.isRef]);

    //marker move event
    let mmid = observer.regist(MOVE_MARKER + point.uuid,()=>{
        let pos = point.position;
        Potree.moveSphere(sphereId, pos);
        Potree.moveAnnotation(annotationId, pos);
    });

    let smiid = observer.regist(SET_MARKER_INDEX + point.uuid,()=>{
        Potree.setAnnotationTitle(annotationId, text);
    })

    //visibility change event
    let setVisibleEventName = SET_NOTEPOINT_VISIBLE;
    let sveid = observer.regist(setVisibleEventName,(visible)=>{
        Potree.setSphereVisible(sphereId, visible);
        Potree.setAnnotationVisible(annotationId, visible);
    });

    //remove event
    observer.once(REMOVE_MARKER + point.uuid,()=>{
        Potree.removeSphere(sphereId);
        Potree.removeAnnotation(annotationId);

        observer.unregistById(mmid);
        observer.unregistById(smiid);
        observer.unregistById(sveid);
    });
}
const createArrowEvent = arrow =>{
    let position = arrow.position,
    color =arrow.color

let arrowXId = Potree.addArrowX(position, color),
    arrowYId = Potree.addArrowY(position, color),
    arrowZId = Potree.addArrowZ(position, color)

Potree.setArrowVisible(arrowXId, VISIBILITY[arrowXId]);
Potree.setArrowVisible(arrowYId, VISIBILITY[arrowYId]);
Potree.setArrowVisible(arrowZId, VISIBILITY[arrowZId]);

//marker move event
let mmid = observer.regist(MOVE_ARROW + arrow.uuid,()=>{
    let pos = arrow.position;
    Potree.moveArrow(arrow, pos);
});

//visibility change event
// let setVisibleEventName = SET_ARROW_VISIBLE;

// let sveid = observer.regist(setVisibleEventName,(visible)=>{
//     Potree.setSphereVisible(sphereId, visible);
//     Potree.setAnnotationVisible(annotationId, visible);
// });

//remove event
observer.once(REMOVE_ARROW + arrow.uuid,()=>{
    Potree.removeArrow(arrow.uuid);
    observer.unregistById(mmid);
});
}


// const createMarker = (isRef) => {
//     let marker = new Marker(isRef);
//     observer.notify(CREATE_MARKER, marker);
//     return marker;
// }

// class Markpair {
//     constructor() {
//         this.id = uuidv4();
//         this.reference = createMarker(1);
//         this.target = createMarker(0);
//         this.idx = -1;
//         this.selected = false;
//     }
// }

// const createPoint = (isRef) => {
//     let notePoint = new NotePoint(isRef);
//     observer.notify(CREATE_NOTEPOINT, notePoint);
//     return notePoint;
// }

class Point {
    constructor() {
        this.id = uuidv4();
        // this.value = createPoint(1);
        // this.notePoint = createMarker(1);
        this.idx = 1;
        this.selected = false;
    }
}


const uuidv4= () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
}
