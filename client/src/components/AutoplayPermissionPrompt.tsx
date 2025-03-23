"use client";

import React from 'react'
import { useAutoplay } from './AutoplayProvider'
import { Dialog, DialogContent, DialogTitle } from './ui/dialog'
import { Button } from './ui/button'

const AutoplayPermissionPrompt = () => {
    
    const { autoplayOn, setAutoplayOn } = useAutoplay();

    return (
        <Dialog open={!autoplayOn}>

            <DialogContent className="sm:max-w-md max-h-[300px] h-screen flex flex-col justify-center gap-10">
                <DialogTitle>
                    <div className='text-lg leading-10 font-semibold'>
                        To use the app please enable autoplay by clicking on the button below:
                    </div>
                </DialogTitle>


                <Button type="button" className='bg-green-800 hover:bg-green-900' onClick={() => { setAutoplayOn(true) }}>
                    Enable autoplay
                </Button>

            </DialogContent>
        </Dialog>
    )
}

export default AutoplayPermissionPrompt