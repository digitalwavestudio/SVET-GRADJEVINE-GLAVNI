import React from "react";

interface HelloWorldProps {
  name?: string;
}

export const HelloWorld: React.FC<HelloWorldProps> = ({ name = "Svet Gradevine" }) => {
  return (
    <div style={{ padding: "20px", textAlign: "center" }}>
      <h1>Hello World! 👋</h1>
      <p>Zdravo, {name}!</p>
      <p>Ovo je Hello World komponenta u Svet Gradevine projektu.</p>
    </div>
  );
};

export default HelloWorld;