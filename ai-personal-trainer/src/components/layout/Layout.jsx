import React from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout() {
  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Header />
        <section className="content">
          <Outlet />
        </section>
      </div>
    </div>
  );
}
