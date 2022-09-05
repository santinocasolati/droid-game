import React from 'react'
import { Route, Routes, useLocation } from 'react-router-dom';
import { CSSTransition, TransitionGroup } from "react-transition-group";
import { gsap } from "gsap";

// Pages
import { Home } from "../pages/Home";

export function AnimatedRoutes() {
    const location = useLocation();

    const routes = [
        { path: "/", name: "Home", Component: Home }
    ];

    const onEnter = (page) => {
        page.children[0].style.display = 'block'
        const tl = gsap.timeline();

        tl.fromTo(page, { opacity: 0 }, { opacity: 1, duration: 0.6 })

        return tl;
    }

    const onExit = (page) => {
        const mains = document.querySelectorAll('main');
        mains[0].style.display = 'none';

        const tl = gsap.timeline();

        tl.to(page, { opacity: 0, duration: 0.6 })

        return tl;
    }

    return (
        <TransitionGroup component={null}>
            <CSSTransition
                key={location.pathname}
                timeout={600}
                onEntered={onEnter}
                onExit={onExit}
            >

                <Routes location={location} key={location.pathname}>
                    {
                        routes.map(({ path, Component }) => {
                            return (
                                <Route key={path} exact path={path} element={
                                    <div className="page">
                                        <Component />
                                    </div>
                                } />
                            )
                        })
                    }
                </Routes>

            </CSSTransition>
        </TransitionGroup>
    )
}