import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faArrowDown, faArrowLeft, faArrowRight, faAnglesUp } from "@fortawesome/free-solid-svg-icons";

export function MobileControls() {
    const touchStart = (key) => {
        switch (key) {
            case 'w':
                window.webgl.playerControls.keysPressed.w = true;
                break;

            case 's':
                window.webgl.playerControls.keysPressed.s = true;
                break;

            case 'a':
                window.webgl.playerControls.keysPressed.a = true;
                break;

            case 'd':
                window.webgl.playerControls.keysPressed.d = true;
                break;

            case 'space':
                window.webgl.playerControls.keysPressed.space = true;
                break;

            default:
                break;
        }
    };

    const touchEnd = (key) => {
        switch (key) {
            case 'w':
                window.webgl.playerControls.keysPressed.w = false;
                break;

            case 's':
                window.webgl.playerControls.keysPressed.s = false;
                break;

            case 'a':
                window.webgl.playerControls.keysPressed.a = false;
                break;

            case 'd':
                window.webgl.playerControls.keysPressed.d = false;
                break;

            case 'space':
                window.webgl.playerControls.keysPressed.space = false;
                break;

            default:
                break;
        }
    };

    const component =
        <div className='mobile-controls'>

            <div className="movement">
                <div className='up' onTouchStart={() => touchStart('w')} onTouchEnd={() => touchEnd('w')}>
                    <FontAwesomeIcon icon={faArrowUp} />
                </div>

                <div className='down' onTouchStart={() => touchStart('s')} onTouchEnd={() => touchEnd('s')}>
                    <FontAwesomeIcon icon={faArrowDown} />
                </div>
            </div>

            <div className="direction">
                <div className="left" onTouchStart={() => touchStart('a')} onTouchEnd={() => touchEnd('a')}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                </div>

                <div className="right" onTouchStart={() => touchStart('d')} onTouchEnd={() => touchEnd('d')}>
                    <FontAwesomeIcon icon={faArrowRight} />
                </div>

                <div className="jump" onTouchStart={() => touchStart('space')} onTouchEnd={() => touchEnd('space')}>
                    <FontAwesomeIcon icon={faAnglesUp} />
                </div>
            </div>

        </div>
        ;

    return component;
}