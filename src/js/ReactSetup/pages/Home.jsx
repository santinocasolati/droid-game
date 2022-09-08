import React from 'react'
import { MobileControls } from '../components/MobileControls'

export function Home() {
    const component =
        <main className='home'>
            <MobileControls />
        </main>
        ;

    return component;
}