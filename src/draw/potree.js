// import { TransformControls} from 'threejs-transformcontrols'
// import { TransformControls} from 'three/examples/jsm/controls/TransformControls.js';

const Potree = window.Potree;
const THREE = window.THREE;

const VIEWER_ARGS = { noDragAndDrop: true };
const MARKER_RADIUS = 0.01;
const ANNOTATION_HEIGHT = 0.5;

//MOVE CAMERA POSITION
const CAMERA_MOVE_SPEED = 0.5;
export const CAMERA = {
  UP: "camera_up",
  DOWN: "camera_down",
  FORWARD: "camera_forward",
  BACK: "camera_back",
  RIGHT: "camera_right",
  LEFT: "camera_left",
};

//EXAMPLE OF POINTCLOUD STYLE
// const STYLE = {
//     activeAttributeName: "intensity gradient",
//     intensityGamma: 0,
//     intensityBrightness: 0,
//     intensityContrast: 0,
//     intensityRange: [1,255],
//     size: 0.1,
// };

const ref = {};

export const initPotree = () => {
  let potree = {
    pointclouds: {},
    annotations: {},
    spheres: {},
    gizmo: {},
  };

  let rendererArea = document.getElementById("potree_render_area"),
    viewer = new Potree.Viewer(rendererArea, VIEWER_ARGS),
    scene = viewer.scene,
    measuringScene = viewer.measuringTool.scene,
    annotationScene = scene.annotations,
    scenePointCloud = scene.scenePointCloud;

  potree.viewer = viewer;
  potree.scene = scene;
  potree.measuringScene = measuringScene;
  potree.annotationScene = annotationScene;
  potree.scenePointCloud = scenePointCloud;

  console.log("Potree inited.", potree);
  ref.potree = potree;
  //for debug
  window.potree = potree;
  return potree;
};

// POINT CLOUD
export const getPointCloud = (uuid) => {
  if (!ref.potree) {
    console.log("Cannot find pointcloud before potree inited.");
    return;
  }
  return ref.potree.pointclouds[uuid];
};

export const getPointcloudByName = (name) => {
  if (!ref.potree) {
    console.log("Cannot find pointcloud before potree inited.");
    return;
  }
  for (let key in ref.potree.pointclouds) {
    let pointcloud = ref.potree.pointclouds[key];
    if (pointcloud.name === name) return pointcloud;
  }
};

//style is material style
export const addPointCloud = (path, name, style = {}, focus = true) => {
  if (!ref.potree) {
    console.log("Cannot load pointcloud before potree inited.");
    return;
  }

  return new Promise((resolve, reject) => {
    Potree.loadPointCloud(path, name, (e) => {
      let pointcloud = e.pointcloud;
      // pointcloud.uuid = uuid;

      let material = pointcloud.material;

      //set material style
      material.pointSizeType = Potree.PointSizeType.FIXED;
      for (let key in style) {
        material[key] = style[key];
      }

      ref.potree.scene.addPointCloud(pointcloud);
      ref.potree.viewer.render();
      if (focus) ref.potree.viewer.zoomTo(pointcloud);
      ref.potree.pointclouds[pointcloud.uuid] = pointcloud;
      resolve(pointcloud);
    });
  });
};

export const setPointCloudVisible = (uuid, visible) => {
  let pointcloud = getPointCloud(uuid);
  if (!pointcloud) {
    console.log("Point cloud " + uuid + " not found.");
    return;
  }
  pointcloud.visible = visible;
};

export const setPointCloudMaterialConfig = (uuid, config) => {
  let pointcloud = getPointCloud(uuid);
  if (!pointcloud) {
    console.log("Point cloud " + uuid + " not found.");
    return;
  }
  for (let key in config) {
    pointcloud.material[key] = config[key];
  }
};

export const removePointCloud = (uuid) => {
  let pointcloud = getPointCloud(uuid);
  if (!pointcloud) {
    console.log("Point cloud " + uuid + " not found.");
    return;
  }

  let scenePointCloud = ref.potree.scenePointCloud,
    pointclouds = ref.potree.scene.pointclouds;

  pointclouds.splice(
    pointclouds.findIndex((el) => el === pointcloud),
    1
  );
  scenePointCloud.remove(pointcloud);
  delete ref.potree.pointclouds[uuid];
};

// SPHERE
export const getSphere = (uuid) => {
  if (!ref.potree) {
    console.log("Cannot find sphere before potree inited.");
    return;
  }
  return ref.potree.spheres[uuid];
};

export const addSphere = (pos, color, editable) => {
  if (!ref.potree) {
    console.log("Cannot add sphere before potree inited.");
    return;
  }
  let uuid = uuidv4(),
    sphere = createSphere(pos, color);
  sphere.uuid = uuid;
  ref.potree.measuringScene.add(sphere);
  ref.potree.spheres[uuid] = sphere;
  return uuid;
};

export const removeSphere = (uuid) => {
  let sphere = getSphere(uuid);
  if (!sphere) {
    console.log("Sphere " + uuid + " not found.");
    return;
  }
  ref.potree.measuringScene.remove(sphere);
  delete ref.potree.spheres[uuid];
};

export const moveSphere = (uuid, pos) => {
  let sphere = getSphere(uuid);
  if (!sphere) {
    console.log("Sphere " + uuid + " not found.");
    return;
  }
  sphere.position.set(pos.x, pos.y, pos.z);
};

export const setSphereVisible = (uuid, visible) => {
  let sphere = getSphere(uuid);
  if (!sphere) {
    console.log("Sphere " + uuid + " not found.");
    return;
  }
  sphere.visible = visible;
};

// ANNOTATION
export const getAnnotation = (uuid) => {
  if (!ref.potree) {
    console.log("Cannot find sphere before potree inited.");
    return;
  }
  return ref.potree.annotations[uuid];
};

export const addAnnotation = (pos, title, height = ANNOTATION_HEIGHT) => {
  if (!ref.potree) {
    console.log("Cannot add annotation before potree inited.");
    return;
  }

  let annotationScene = ref.potree.annotationScene;

  let annotation = new Potree.Annotation({
    position: [pos.x, pos.y, pos.z + height],
    title: title,
    describe: "",
  });
  annotationScene.add(annotation);
  ref.potree.annotations[annotation.uuid] = annotation;

  annotation.elTitle[0].addEventListener("click", () => {
    console.log("Annotation " + annotation.title, annotation.position);
    focus(annotation.position);
  });

  return annotation.uuid;
};

export const removeAnnotation = (uuid) => {
  let annotation = getAnnotation(uuid);
  if (!annotation) {
    console.log("Annotation " + uuid + " not found.");
    return;
  }
  ref.potree.annotationScene.remove(annotation);
  delete ref.potree.annotations[uuid];
};

export const moveAnnotation = (uuid, pos) => {
  let annotation = getAnnotation(uuid);
  if (!annotation) {
    console.log("Annotation " + uuid + " not found.");
    return;
  }
  annotation.position.set(pos.x, pos.y, pos.z + ANNOTATION_HEIGHT);
};

export const setAnnotationVisible = (uuid, visible) => {
  let annotation = getAnnotation(uuid);
  if (!annotation) {
    console.log("Annotation " + uuid + " not found.");
    return;
  }
  annotation.visible = visible;
};

export const setAnnotationTitle = (uuid, title) => {
  let annotation = getAnnotation(uuid);
  if (!annotation) {
    console.log("Annotation " + uuid + " not found.");
    return;
  }
  annotation.title = title;
};

// ARROW
export const addArrowX = (x, y, z, len, color) => {
  x = x === undefined ? 0 : x;
  y = y === undefined ? 2 : y;
  z = z === undefined ? 0 : z;
  len = len === undefined ? 3 : len;
  color = color === undefined ? 0x00ff00 : color;

  let camera = ref.potree.scene.getActiveCamera(),
    dom = document.getElementById("potree_render_area");
  let uuid = uuidv4();
  // arrow = new THREE.ArrowHelper(
  //     new THREE.Vector3(1, 0, 0).normalize(),
  //     new THREE.Vector3(x, y, z),
  //     len,
  //     color);
  //     arrow.uuid = uuid;
  // arrow.uuid = uuid;

  // ref.potree.measuringScene.add(arrow);

  // ref.potree.arrows[uuid] = uuid;
  return uuid;
};

export const addArrowY = (x, y, z, len, color) => {
  x = x === undefined ? 0 : x;
  y = y === undefined ? 2 : y;
  z = z === undefined ? 0 : z;
  len = len === undefined ? 3 : len;
  color = color === undefined ? 0x00ff00 : color;

  let uuid = uuidv4(),
    arrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 1, 0).normalize(),
      new THREE.Vector3(x, y, z),
      len,
      color
    );
  arrow.uuid = uuid;

  ref.potree.measuringScene.add(arrow);

  ref.potree.arrows[uuid] = uuid;
  return uuid;
};

export const addArrowZ = (x, y, z, len, color) => {
  x = x === undefined ? 0 : x;
  y = y === undefined ? 2 : y;
  z = z === undefined ? 0 : z;
  len = len === undefined ? 3 : len;
  color = color === undefined ? 0x00ff00 : color;

  let uuid = uuidv4(),
    arrow = new THREE.ArrowHelper(
      new THREE.Vector3(0, 0, 1).normalize(),
      new THREE.Vector3(x, y, z),
      len,
      color
    );
  arrow.uuid = uuid;

  ref.potree.measuringScene.add(arrow);

  ref.potree.arrows[uuid] = uuid;
  return uuid;
};

export const getArrow = (uuid) => {
  if (!ref.potree) {
    console.log("Cannot find arrows before potree inited.");
    return;
  }
  return ref.potree.arrows[uuid];
};

export const moveArrow = (uuid, pos) => {
  let arrow = getArrow(uuid);
  if (!arrow) {
    console.log("arrows " + uuid + " not found.");
    return;
  }
  arrow.position.set(pos.x, pos.y, pos.z);
};

export const removeArrow = (uuid) => {
  let arrow = getSphere(uuid);
  if (!arrow) {
    console.log("arrows " + uuid + " not found.");
    return;
  }
  ref.potree.measuringScene.remove(arrow);
  delete ref.potree.arrows[uuid];
};

export const setArrowVisible = (uuid, visible) => {
  let arrow = getArrow(uuid);
  if (!arrow) {
    console.log("arrows " + uuid + " not found.");
    return;
  }
  arrow.visible = visible;
};

// UTILS
export const getMousePointCloudIntersection = (mousePos) => {
  if (!ref.potree) {
    console.log("Cannot get intersection before potree inited.");
    return;
  }

  let viewer = ref.potree.viewer,
    camera = ref.potree.scene.getActiveCamera(),
    pointclouds = ref.potree.scene.pointclouds;

  return Potree.Utils.getMousePointCloudIntersection(
    mousePos,
    camera,
    viewer,
    pointclouds
  );
};

export const getPosByPointIdxFromPcd = (pointcloud, pointIdx) => {
  let root = pointcloud.root;
  return findPositionByPointindex(root, pointIdx);
};

export const focusOnMouse = (mousePos) => {
  if (!ref.potree) {
    console.log("Cannot focus before potree inited.");
    return;
  }

  ref.potree.viewer.orbitControls.dispatchEvent({
    mouse: mousePos,
    object: null,
    type: "dblclick",
  });
};

export const focus = (pos) => {
  if (!ref.potree) {
    console.log("Cannot focus before potree inited.");
    return;
  }

  let TWEEN = window.TWEEN;
  let orbitControls = ref.potree.viewer.orbitControls;
  let targetRadius = 5;

  let d = orbitControls.scene.view.direction.multiplyScalar(-1);
  let cameraTargetPosition = new THREE.Vector3().addVectors(
    pos,
    d.multiplyScalar(targetRadius)
  );
  // TODO Unused: let controlsTargetPosition = pos;

  let animationDuration = 600;
  let easing = TWEEN.Easing.Quartic.Out;

  {
    // animate
    let value = { x: 0 };
    let tween = new TWEEN.Tween(value).to({ x: 1 }, animationDuration);
    tween.easing(easing);
    orbitControls.tweens.push(tween);

    let startPos = orbitControls.scene.view.position.clone();
    let targetPos = cameraTargetPosition.clone();
    let startRadius = orbitControls.scene.view.radius;
    let targetRadius = cameraTargetPosition.distanceTo(pos);

    tween.onUpdate(() => {
      let t = value.x;
      orbitControls.scene.view.position.x =
        (1 - t) * startPos.x + t * targetPos.x;
      orbitControls.scene.view.position.y =
        (1 - t) * startPos.y + t * targetPos.y;
      orbitControls.scene.view.position.z =
        (1 - t) * startPos.z + t * targetPos.z;

      orbitControls.scene.view.radius =
        (1 - t) * startRadius + t * targetRadius;
      orbitControls.viewer.setMoveSpeed(orbitControls.scene.view.radius / 2.5);
    });

    tween.onComplete(() => {
      orbitControls.tweens = orbitControls.tweens.filter((e) => e !== tween);
    });

    tween.start();
  }
};

//up, down, forward, back, left, right
export const moveCamera = (toward) => {
  if (!ref.potree) {
    console.log("Cannot move before potree inited.");
    return;
  }

  if (moveCamera.isMoving === undefined) moveCamera.isMoving = false;

  if (moveCamera.isMoving) return;

  let view = ref.potree.scene.view,
    position = view.position,
    direction = view.direction;

  switch (toward) {
    case CAMERA.UP:
      position.set(position.x, position.y, position.z + CAMERA_MOVE_SPEED);
      return;
    case CAMERA.DOWN:
      position.set(position.x, position.y, position.z - CAMERA_MOVE_SPEED);
      return;
  }

  let unit = Math.sqrt(direction.x * direction.x + direction.y * direction.y);
  if (unit === 0) return;

  let dPosition = {
    x: (direction.x * CAMERA_MOVE_SPEED) / unit,
    y: (direction.y * CAMERA_MOVE_SPEED) / unit,
  };

  switch (toward) {
    case CAMERA.BACK:
      dPosition = {
        x: dPosition.x * -1,
        y: dPosition.y * -1,
        z: 0,
      };
      break;
    case CAMERA.LEFT:
      dPosition = {
        x: dPosition.y * -1,
        y: dPosition.x,
        z: 0,
      };
      break;
    case CAMERA.RIGHT:
      dPosition = {
        x: dPosition.y,
        y: dPosition.x * -1,
        z: 0,
      };
      break;
  }
  position.set(position.x + dPosition.x, position.y + dPosition.y, position.z);

  moveCamera.isMoving = false;
};

///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////  UNEXPORTED FUNCTIONS  ////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////

const uuidv4 = () => {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

const createSphere = (position, color) => {
  console.log("create sphere");
  let geometry = new THREE.SphereGeometry(MARKER_RADIUS, 8, 6),
    material = new THREE.MeshBasicMaterial({ color: color }),
    sphere = new THREE.Mesh(geometry, material);
  sphere.position.set(position.x, position.y, position.z);
  return sphere;
};

const findPositionByPointindex = (node, index) => {
  if (node.geometryNode) {
    let attributes = node.geometryNode.geometry.attributes,
      pointIndexList = attributes["point-index"].array,
      positionList = attributes["position"].array;

    for (let i = 0; i < pointIndexList.length; i++) {
      if (pointIndexList[i] === index) {
        let x = positionList[i * 3],
          y = positionList[i * 3 + 1],
          z = positionList[i * 3 + 2];

        let position = new THREE.Vector3(x, y, z);
        position.applyMatrix4(node.sceneNode.matrixWorld);
        return position;
      }
    }
  }

  if (node.children.length > 0) {
    for (let key in node.children) {
      let child = node.children[key];
      if (child) {
        let result = findPositionByPointindex(child, index);
        if (result) return result;
      }
    }
  }

  return false;
};

// export const createTransformControls =() => {
//     if (tcontrols != undefined) tcontrols.dispose();
//     tcontrols = new TransformControls(camera, renderer.domElement);
//     tcontrols.addEventListener("change", renderer);
//     tcontrols.addEventListener("dragging-changed", function (event) {
//       controls.enabled = !event.value;
//     });
