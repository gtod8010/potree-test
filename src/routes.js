import PotreeView from "./views/potree/index";
import PotreeFiber from "./views/fiber/index";

const routes = [
  {
    path: "/",
    element: <PotreeView />,
    children: [
      { path: "fiber", element: <PotreeFiber /> },
      { path: "/", element: <PotreeView /> },
    ],
  },
];
export default routes;
