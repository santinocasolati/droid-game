import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router } from "react-router-dom";

import { App } from './App.jsx';

export default class ReactSetup {
    constructor() {
        const container = document.getElementById('root');
        const root = ReactDOM.createRoot(container);

        root.render(
            <Router>
                <App />
            </Router>
        );
    }
}
