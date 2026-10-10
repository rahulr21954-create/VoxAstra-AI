const Sidebar = ({
    activePage,
    setActivePage
}) => {

    const menuItems = [
        {
            id: "overview",
            label: "Overview",
            icon: "⌂"
        },
        {
            id: "voice",
            label: "Voice Analysis",
            icon: "◉"
        },
        {
            id: "transactions",
            label: "Transactions",
            icon: "⇄"
        },
        {
            id: "alerts",
            label: "Fraud Alerts",
            icon: "⚠"
        },
        {
            id: "security",
            label: "Security",
            icon: "✓"
        }
    ];

    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.reload();
    };

    return (
        <aside className="
            fixed
            left-0
            top-0
            z-50
            flex
            h-screen
            w-64
            flex-col
            border-r
            border-slate-800
            bg-slate-950
            px-4
            py-6
            text-white
        ">

            {/* Brand */}

            <div className="
                mb-10
                flex
                items-center
                gap-3
                px-3
            ">

                <div className="
                    flex
                    h-10
                    w-10
                    items-center
                    justify-center
                    rounded-xl
                    bg-emerald-400
                    font-bold
                    text-slate-950
                ">
                    V
                </div>

                <div>
                    <h2 className="
                        text-lg
                        font-bold
                    ">
                        VoxAstra
                    </h2>

                    <p className="
                        text-xs
                        text-slate-500
                    ">
                        AI Security
                    </p>
                </div>

            </div>

            {/* Menu */}

            <div>

                <p className="
                    mb-3
                    px-3
                    text-[10px]
                    font-semibold
                    tracking-[0.18em]
                    text-slate-600
                ">
                    MAIN MENU
                </p>

                <div className="space-y-1">

                    {menuItems.map((item) => {

                        const active =
                            activePage === item.id;

                        return (
                            <button
                                key={item.id}
                                onClick={() =>
                                    setActivePage(item.id)
                                }
                                className={`
                                    flex
                                    w-full
                                    items-center
                                    gap-3
                                    rounded-xl
                                    px-3
                                    py-3
                                    text-sm
                                    transition
                                    ${
                                        active
                                            ? "bg-emerald-400 text-slate-950 font-semibold"
                                            : "text-slate-400 hover:bg-slate-900 hover:text-white"
                                    }
                                `}
                            >

                                <span className="
                                    flex
                                    h-6
                                    w-6
                                    items-center
                                    justify-center
                                    text-base
                                ">
                                    {item.icon}
                                </span>

                                {item.label}

                            </button>
                        );

                    })}

                </div>

            </div>

            {/* Bottom */}

            <div className="mt-auto">

                <div className="
                    mb-4
                    rounded-xl
                    border
                    border-slate-800
                    bg-slate-900
                    p-3
                ">

                    <div className="
                        flex
                        items-center
                        gap-2
                    ">

                        <span className="
                            h-2
                            w-2
                            rounded-full
                            bg-emerald-400
                        " />

                        <div>

                            <p className="
                                text-xs
                                font-semibold
                                text-white
                            ">
                                Protection Active
                            </p>

                            <p className="
                                mt-1
                                text-[10px]
                                text-slate-500
                            ">
                                VoxAstra monitoring
                            </p>

                        </div>

                    </div>

                </div>

                <button
                    onClick={handleLogout}
                    className="
                        flex
                        w-full
                        items-center
                        gap-3
                        rounded-xl
                        border
                        border-slate-800
                        px-3
                        py-3
                        text-left
                        text-sm
                        text-slate-400
                        transition
                        hover:bg-slate-900
                        hover:text-white
                    "
                >
                    <span>↪</span>
                    Logout
                </button>

            </div>

        </aside>
    );
};

export default Sidebar;