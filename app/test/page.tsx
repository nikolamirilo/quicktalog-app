'use client';

import Head from 'next/head';
import Script from 'next/script';
import { useCallback, useEffect } from 'react';

export default function Page() {
	// This is the official up-to-date way (2024–2025)
	const openHubSpotChat = useCallback(() => {
		if (typeof window !== 'undefined' && window.HubSpotConversations?.widget) {
			// Method 1: widget is already loaded → open immediately
			window.HubSpotConversations.widget.open();
		} else {
			// Method 2: still loading → queue the open command
			// HubSpot listens for this event name now
			window.onHubSpotConversationsReady = () => {
				window.HubSpotConversations?.widget?.open();
			};

			// Trigger the event in case HubSpot already finished loading
			// (this is the trick that makes it work instantly in 99% of cases)
			if (window.HubSpotConversations) {
				window.HubSpotConversations.widget.open();
			}
		}
	}, []);


	return (
		<>
			{/* <Head>
				<Script
					id="hs-script-loader"
					strategy="afterInteractive"
					src="//js-eu1.hs-scripts.com/146895463.js"
				/>
			</Head> */}

			<div>
				{/* HubSpot script */}


				<div style={{ padding: '4rem', textAlign: 'center' }}>
					<h1>Welcome</h1>
					<p>Click below to start chatting</p>

					<button
						onClick={openHubSpotChat}
						style={{
							padding: '14px 32px',
							fontSize: '18px',
							backgroundColor: '#ff7a59',
							color: 'white',
							border: 'none',
							borderRadius: '8px',
							cursor: 'pointer',
							boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
						}}
					>
						Open HubSpot Chat
					</button>
				</div>
			</div>
		</>
	);
}