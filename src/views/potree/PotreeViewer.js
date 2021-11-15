import React, { useState, useEffect, useRef, useCallback } from "react";

import * as Potree from "../../draw/potree";
import * as Presenter from "../../draw/presenter";

const PotreeViewer = (props) => {
  const container = useRef();
  const [potree, setPotree] = useState();

  //init viewer
  useEffect(() => {
    console.log("Potree viewer loaded.");
    Presenter.init();
    setPotree(Potree.initPotree());
    return () => {
      console.log("unmount potree viewer.");
    };
  }, []);

  return (
    <div>
      <div className="potree_container" ref={container}>
        <div id="potree_render_area"></div>
        <div id="potree_sidebar_container"></div>
      </div>
    </div>
  );
};

export default PotreeViewer;
