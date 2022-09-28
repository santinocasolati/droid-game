import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowUp, faArrowDown, faArrowLeft, faArrowRight, faAnglesUp } from "@fortawesome/free-solid-svg-icons";

export function MobileControls() {
    const keysPressed = window.webgl.controls.keysPressed;

    const touchStart = (key) => {
        switch (key) {
            case 'forward':
                keysPressed.forward = true;
                break;

            case 'backward':
                keysPressed.backward = true;
                break;

            case 'left':
                keysPressed.left = true;
                break;

            case 'right':
                keysPressed.right = true;
                break;

            case 'jump':
                keysPressed.jump = true;
                break;

            default:
                break;
        }
    };

    const touchEnd = (key) => {
        switch (key) {
            case 'forward':
                keysPressed.forward = false;
                break;

            case 'backward':
                keysPressed.backward = false;
                break;

            case 'left':
                keysPressed.left = false;
                break;

            case 'right':
                keysPressed.right = false;
                break;

            case 'jump':
                keysPressed.jump = false;
                break;

            default:
                break;
        }
    };

    const component =
        <div className={document.querySelector('html').dataset.device === 'desktop' ? 'mobile-controls off' : 'mobile-controls'}>

            <div className="movement">
                <div className='up' onTouchStart={() => touchStart('forward')} onTouchEnd={() => touchEnd('forward')}>
                    <FontAwesomeIcon icon={faArrowUp} />
                </div>

                <div className='down' onTouchStart={() => touchStart('backward')} onTouchEnd={() => touchEnd('backward')}>
                    <FontAwesomeIcon icon={faArrowDown} />
                </div>
            </div>

            <div className="direction">
                <div className="left" onTouchStart={() => touchStart('left')} onTouchEnd={() => touchEnd('left')}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                </div>

                <div className="right" onTouchStart={() => touchStart('right')} onTouchEnd={() => touchEnd('right')}>
                    <FontAwesomeIcon icon={faArrowRight} />
                </div>

                <div className="jump" onTouchStart={() => touchStart('jump')} onTouchEnd={() => touchEnd('jump')}>
                    <FontAwesomeIcon icon={faAnglesUp} />
                </div>
            </div>

        </div>
        ;

    return component;
}