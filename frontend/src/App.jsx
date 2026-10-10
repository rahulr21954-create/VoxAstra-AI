import {
    useEffect,
    useState
} from "react";

import Sidebar from "./components/Sidebar";

import {
    getSecurityDashboard
} from "./services/dashboardService";


function App() {
    return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
            <h1 className="text-4xl font-bold text-emerald-400">
                VoxAstra AI
            </h1>
        </div>
    );
}

export default App;
