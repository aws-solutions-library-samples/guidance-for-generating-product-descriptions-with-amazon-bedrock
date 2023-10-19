// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: MIT.

import './App.css';
import '@aws-amplify/ui-react/styles.css';
import React, { useState, useEffect } from 'react';
import { Button, withAuthenticator } from '@aws-amplify/ui-react';
import { Amplify, Auth } from 'aws-amplify';

import { API_GATEWAY_URL } from './config';

const fileToB64 = file => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsBinaryString(file);
    reader.onload = () => resolve(btoa(reader.result));
    reader.onerror = reject;
});


function App({ signOut, user }) {
    const [modelSelected, setModelSelected] = useState('Anthropic: Claude');
    const [inputText, setInputText] = useState("");
    const [responseText, setResponseText] = useState("");
    const [imageResponse, setImageResponse] = useState(null);
    const [imageResponseImg, setImageResponseImg] = useState("");
    const [isBuffering, setIsBuffering] = useState(false)
    const [isBufferingLanguage, setIsBufferingLanguage] = useState(false)
    const [languageResponse, setLanguageResponse] = useState("");
    const [translationQueue, setTranslationQueue] = useState([]);
    const [languageSelected, setLanguageSelected] = useState("English");
    const [demoSelected, setDemoSelected] = useState("Image");
    const [userInputPrompt, setUserInputPrompt] = useState('');
    const [imageBlob, setImageBlob] = useState('');
    const [userInputEnhance, setUserInputEnhance] = useState('');
    const [enhanceResponse, setEnhanceResponse] = useState('');
    const [authData, setAuthData] = useState({})

    async function getSession() {
        try {
          const getAuth = await Auth.currentSession();
          console.log(getAuth);
          console.log(getAuth.idToken.jwtToken)
            setAuthData(getAuth.idToken.jwtToken)
        } catch (error) {
          console.log(error);
        }
      }
      
      

    useEffect(() => {
        getSession();
        
    }, [])

    const handleImageFormSubmit = (event) => {
        event.preventDefault();
        setIsBuffering(true)
        fileToB64(event.target.files[0])
            .then((b64) => fetch(API_GATEWAY_URL +"/bedrock", { 
                // /call-rekognition-api
            method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${authData}`
                },
                body: JSON.stringify({'image': b64, 'endpoint': '/api/call-rekognition-api'}),
        })
            )
            .then((response) => response.json())
            .then((data) => {
                console.log(JSON.parse(data.body).labels)
                // console.log(data.labels)
                setImageResponse(URL.createObjectURL(event.target.files[0]));
                const output = JSON.parse(data.body).labels.join(" ");
                setInputText(`Build me a product Description for ${output}`);
                let payload = {
                    modelId: 'anthropic.claude-instant-v1',
                    contentType: 'application/json',
                    accept: '*/*',
                    endpoint: '/api/conversation/predict-claude',
                    body: JSON.stringify({
                        prompt: `Build me a product Description using 120 words or less. Here is additional information about the product photograph ${output}`,
                        max_tokens_to_sample: 300,
                        temperature: 0.5,
                        top_k: 250,
                        top_p: 1,
                        stop_sequences: ['\n\nHuman:']
                    }),
                };
                fetch(API_GATEWAY_URL + '/bedrock', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        "Authorization": `Bearer ${authData}`
                    },
                    body: JSON.stringify(payload)
                })
                    .then((response) => response.json())
                    .then((data) => {
                        
                        setResponseText(JSON.parse(data.body))
                        handleTranslations(JSON.parse(data.body))
                    }
                    )
                    .catch((error) => console.error("Error:", error))
                    .finally(
                        setTimeout(function () {
                            setIsBuffering(false)
                        }, 2000)
                    )
            })
            .catch((error) => console.error("Error:", error))

    };

    const base64ToBlob = (base64Data, contentType = "image/jpeg") => {
        const byteCharacters = atob(base64Data);
        const byteArrays = [];

        for (let offset = 0; offset < byteCharacters.length; offset += 512) {
            const slice = byteCharacters.slice(offset, offset + 512);

            const byteNumbers = new Array(slice.length);
            for (let i = 0; i < slice.length; i++) {
                byteNumbers[i] = slice.charCodeAt(i);
            }

            const byteArray = new Uint8Array(byteNumbers);
            byteArrays.push(byteArray);
        }

        return new Blob(byteArrays, { type: contentType });
    };

    const handleImageFormSubmitPrompt = (blob) => {
        setIsBuffering(true)
        setLanguageResponse("")
        fetch(API_GATEWAY_URL + '/bedrock', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authData}`
            },
            body: JSON.stringify({'image': blob, 'endpoint': "/api/call-rekognition-api"}),
        })
            .then((response) => response.json())
            .then((data) => {
                const output = JSON.parse(data.body).labels.join(" ");
                setInputText(`Build me a product Description for ${output}`);
                let payload = {
                    modelId: 'anthropic.claude-instant-v1',
                    contentType: 'application/json',
                    endpoint: '/api/conversation/predict-claude',
                    accept: '*/*',
                    body: JSON.stringify({
                        prompt: `Build me a product Description using 120 words or less. Here is additional information about the product photograph ${output}`,
                        max_tokens_to_sample: 300,
                        temperature: 0.5,
                        top_k: 250,
                        top_p: 1,
                        stop_sequences: ['\n\nHuman:']
                    }),
                };
                fetch(API_GATEWAY_URL + '/bedrock', {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${authData}`
                    },
                    body: JSON.stringify(payload),
                })
                    .then((response) => response.json())
                    .then((data) => {
                        setResponseText(JSON.parse(data.body))
                        handleTranslations(JSON.parse(data.body))
                    })
                    .catch((error) => console.error("Error:", error))
                    .finally(
                        setIsBuffering(false)
                    )
            })
            .catch((error) => console.error("Error:", error))

    };

    const handleImageChange = (event) => {
        setLanguageResponse("")
        setLanguageSelected("English")
        const imageFile = event.target.files[0];
        if (imageFile) {
            handleImageFormSubmit(event);
        }
    };

    const handleSubmit = (event) => {
        event.preventDefault();
        setIsBuffering(true);
        setLanguageResponse("")
        setImageResponseImg("")
        const payload = {
            "modelId": "stability.stable-diffusion-xl",
            "contentType": "application/json",
            "accept": "application/json",
            'endpoint': "/api/call-stablediffusion",
            "body": JSON.stringify({
                "text_prompts": [
                    { "text": userInputPrompt }
                ],
                "cfg_scale": 10,
                "seed": 0,
                "steps": 50
            })
        };

        fetch(API_GATEWAY_URL+'/bedrock', {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${authData}`
            },
            body: JSON.stringify(payload)
        })
            .then(response => response.json())
            .then(data => {
                if (JSON.parse(data.body).result === "success" && JSON.parse(data.body).artifacts.length > 0) {
                    const base64Data = JSON.parse(data.body).artifacts[0].base64;
                    const imageUrl = "data:image/jpeg;base64," + base64Data;
                    setImageResponseImg(<img src={imageUrl} alt="Generated Image" />);

                    setImageBlob(base64Data);
                    handleImageFormSubmitPrompt(base64Data);
                } else {
                    setImageResponseImg("Image API failed to generate the image.");
                }
            })
            // .catch(() => {
            //   setImageResponseImg("Image API request failed.");
            // })
            .finally(() => {
                setIsBuffering(false)
            });
    };

    const sendMessageEnhance = () => {
        setIsBuffering(true);
        setEnhanceResponse('')

        let payload = {
            modelId: 'anthropic.claude-instant-v1',
            contentType: 'application/json',
            endpoint: '/api/conversation/predict-claude',
            accept: '*/*',
            body: JSON.stringify({
                prompt: `I will be listing a product on my eCommerce Marketplace. Make the following product description better: ${userInputEnhance}`,
                max_tokens_to_sample: 300,
                temperature: 0.5,
                top_k: 250,
                top_p: 1,
                stop_sequences: ['\n\nHuman:']
            }),
        };

        // setUserInput('');
        fetch(API_GATEWAY_URL +'/bedrock', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                "Authorization": `Bearer ${authData}`
            },
            body: JSON.stringify(payload)
        })
            .then(response => response.json())
            .then(response => {
                setEnhanceResponse(JSON.parse(response.body))
            })
            .catch(error => {
                console.error('Error:', error);
            }).finally(() => {
                setIsBuffering(false)
            });
    };

    const handleTranslations = (description) => {
        setIsBufferingLanguage(true);

        let languages = ['Spanish', 'French', 'German'];

        let payload = {
            prompt: '',
            maxTokens: 200,
            temperature: 0.5,
            topP: 0.5,
            stopSequences: [],
            countPenalty: { scale: 0 },
            presencePenalty: { scale: 0 },
            frequencyPenalty: { scale: 0 }
        };

        let response_container = [
            {
                'Language': 'English',
                'Description': description
            }
        ];
        setLanguageResponse(response_container)
        let newQueue = [];

        for (let i = 0; i < languages.length; i++) {
            payload.prompt = `Translate this to ${languages[i]}: ${description}`;
            
            callai21(languages[i], payload)
        }

        // setTranslationQueue((prevQueue) => [...prevQueue, ...newQueue]);
        processTranslationQueue();
    };

    const processTranslationQueue = () => {
        if (translationQueue.length > 0) {
            const nextRequest = translationQueue[0];

            setTranslationQueue((prevQueue) => prevQueue.slice(1));

            nextRequest
                .then((response) => {
                    console.log(response);
                })
                .catch((error) => {
                    console.error('Error:', error);
                })
                .finally(() => {
                    processTranslationQueue();
                });
        } else {
            setIsBufferingLanguage(false);
        }
    };

    const callai21 = async (language, payload) => {
        // setIsBufferingLanguage(true);
        console.log('payload in callai21 start:');
        console.log(payload);
        payload['endpoint'] = '/api/conversation/predict-ai21'
        console.log('payload in callai21 end');
        console.log('');
    
        try {
            const response = await fetch(API_GATEWAY_URL+'/bedrock', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    "Authorization": `Bearer ${authData}`
                },
                body: JSON.stringify(payload)
            });
    
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
    
            const responseData = await response.json();
            const botResponse = JSON.parse(responseData.body).output_text;
            console.log(language);
            console.log(botResponse);
    
            setLanguageResponse(prevLanguageResponse => [
                ...prevLanguageResponse,
                {
                    'Language': language,
                    'Description': botResponse
                }
            ]);
        } catch (error) {
            console.error('Error:', error);
        } finally {
            setIsBufferingLanguage(false);
            setIsBuffering(false)
        }
    };


    const getSelectedDescription = () => {
        for (let i = 0; i < languageResponse.length; i++) {
            if (languageResponse[i].Language == languageSelected) {
                return languageResponse[i].Description
            }
        }
    }

    const handleDemoSelection = (demo) => {
        setResponseText('')
        setDemoSelected(demo)
        setLanguageResponse('')
        setImageResponseImg('')
        setLanguageSelected('English')
        setEnhanceResponse('')
        setUserInputPrompt('')
        setUserInputEnhance('')
    }

    return (
        
            <div id="ContentSection">
                <div className="Contents">
                    <h1>Building Product Descriptions with Amazon Bedrock</h1>
                    <div className="Demos">
                        <div className="DemoOptions">
                            <span className={demoSelected == 'Image' ? "active" : "inactive"}
                                onClick={() => handleDemoSelection('Image')}>
                                Create Product Description from Image
                            </span>
                            <span className={demoSelected == 'Prompt' ? "active" : "inactive"}
                                onClick={() => handleDemoSelection('Prompt')}>
                                Create Image and Description from Text
                            </span>
                            <span className={demoSelected == 'Enhance' ? "active" : "inactive"}
                                onClick={() => handleDemoSelection('Enhance')}>
                                Enhance a Product Description
                            </span>
                        </div>
                    </div>
                    {demoSelected === 'Image' &&
                        <form onSubmit={handleImageFormSubmit} encType="multipart/form-data">
                            <label htmlFor="imageUpload">
                                <input
                                    type="file"
                                    id="imageUpload"
                                    name="imageUpload"
                                    accept="image/*"
                                    required
                                    onChange={handleImageChange}
                                />
                            </label>
                        </form>
                    }
                    {demoSelected === 'Prompt' &&
                        <div className="user-input-product">
                            <textarea
                                value={userInputPrompt}
                                onChange={(e) => setUserInputPrompt(e.target.value)}
                                placeholder="Provide description of product and hit send to generate an image and product description of that image..."
                            />
                            <button type="button" onClick={handleSubmit} disabled={isBuffering}>Send</button>
                        </div>
                    }
                    {demoSelected === 'Enhance' &&
                        <div className="user-input-product">
                            <textarea
                                value={userInputEnhance}
                                onChange={(e) => setUserInputEnhance(e.target.value)}
                                placeholder="Provide product description and hit send to enhance the product description with Claude..."
                            />
                            <button type="button" onClick={sendMessageEnhance} disabled={isBuffering}>Send</button>
                        </div>
                    }

                    {responseText !== '' && demoSelected !== 'Prompt' &&
                        <div className="ImageLabel">
                            <div id="imageResponse">
                                {imageResponse && (
                                    <img src={imageResponse} alt="Uploaded Image" style={{ maxWidth: "500px", maxHeight: "500px", display: "block", margin: "0 auto" }} />
                                )}
                            </div>
                        </div>
                    }
                    {imageResponseImg !== '' && demoSelected !== 'Image' &&
                        <div className="ImageLabel">
                            <div id="imageResponse">{imageResponseImg}</div>
                        </div>
                    }

                    {isBuffering &&
                        <div className="dots">
                            <div className="dot"></div>
                            <div className="dot"></div>
                            <div className="dot"></div>
                        </div>
                    }
                    {isBufferingLanguage &&
                        <div className="dots">
                            <div className="dot"></div>
                            <div className="dot"></div>
                            <div className="dot"></div>
                        </div>
                    }

                    <div className="Translations">
                    <div className="TranslationOptions">
                    {languageResponse !== "" &&
                        languageResponse.map((response) => (
                            
                                    <span
                                        className={response.Language == languageSelected ? "active" : "inactive"}
                                        key={response.Language}
                                        onClick={() => setLanguageSelected(response.Language)}
                                    >
                                        {response.Language}
                                    </span>
                                    ))}
                                </div>
                                
                                <span className="ProductDesc" style={{ display: languageResponse !== "" ? 'initial':'none'}} >Product Description:</span>
                                
                                <div className="ProductDescription">
                                
                                    {languageResponse !== "" &&
                                        getSelectedDescription()
                                    }
                                    {enhanceResponse !== '' &&
                                        enhanceResponse
                                    }
                                </div>
                                
                        
                            </div>
                </div>
            </div>
    );
}

export default App;
