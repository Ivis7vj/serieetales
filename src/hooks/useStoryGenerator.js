import { useState, useRef, useCallback } from 'react';
import html2canvas from 'html2canvas';

export const useStoryGenerator = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const storyCardRef = useRef(null);

    const generateStory = useCallback(async (movieName) => {
        if (!storyCardRef.current) return { success: false, error: 'Ref missing' };

        setIsGenerating(true);

        try {
            const canvas = await html2canvas(storyCardRef.current, {
                useCORS: true,
                scale: 2, // Higher scale for better quality
                backgroundColor: null,
                width: 1080,
                height: 1080,
                windowWidth: 1080,
                windowHeight: 1080,
                scrollX: 0,
                scrollY: 0,
                logging: false,
                onclone: (clonedDoc) => {
                    const element = clonedDoc.getElementById('story-card-element');
                    if (element) {
                        element.style.transform = 'none';
                    }
                }
            });

            return new Promise((resolve) => {
                canvas.toBlob(async (blob) => {
                    if (!blob) {
                        setIsGenerating(false);
                        resolve({ success: false, error: 'Blob creation failed' });
                        return;
                    }

                    const file = new File([blob], `Letterboard_Review_${movieName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.png`, { type: 'image/png' });
                    const url = URL.createObjectURL(blob);

                    // Web Share API with File
                    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                        try {
                            await navigator.share({
                                files: [file]
                                // text/title removed to force "Story/Image" mode behavior on most devices
                            });
                            setIsGenerating(false);
                            resolve({ success: true, method: 'share', url });
                        } catch (shareError) {
                            console.log('Share API failed or cancelled:', shareError);
                            // If user cancelled, it's technically a success in terms of flow execution
                            setIsGenerating(false);
                            resolve({ success: true, method: 'fallback', url, file });
                        }
                    } else {
                        // Web Share API not supported -> Fallback
                        setIsGenerating(false);
                        resolve({ success: true, method: 'fallback', url, file });
                    }
                }, 'image/png', 1.0);
            });

        } catch (error) {
            console.error("Story generation failed:", error);
            setIsGenerating(false);
            return { success: false, error: error.message };
        }
    }, []);

    return {
        generateStory,
        storyCardRef,
        isGenerating
    };
};
