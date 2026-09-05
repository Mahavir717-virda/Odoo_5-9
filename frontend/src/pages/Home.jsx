import React from "react";
import { useNavigate } from "react-router-dom";
function Home() {
  const navigate = useNavigate();
  return (
    <>
      <h1> This is Home Page.</h1>
    </>
  );
}

export default Home;