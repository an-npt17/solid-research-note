import React, { createContext, useContext, useEffect, useState } from "react";
import {
	initSession,
	getWebId,
	isLoggedIn,
	onSessionChange,
} from "./session.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
	const [sessionState, setSessionState] = useState({
		webId: undefined,
		loggedIn: false,
		loading: true,
	});

	useEffect(() => {
		// Public viewer route doesn't need auth — skip OIDC init to prevent redirect
		const isViewerRoute = window.location.pathname.endsWith('/viewer')
		if (isViewerRoute) {
			setSessionState({ webId: undefined, loggedIn: false, loading: false })
			return
		}

		// Handle the OIDC redirect on first load, then read session state
		initSession().then(() => {
			setSessionState({
				webId: getWebId(),
				loggedIn: isLoggedIn(),
				loading: false,
			});
		});

		// Keep React state in sync whenever Inrupt fires login/logout events
		onSessionChange(() => {
			setSessionState({
				webId: getWebId(),
				loggedIn: isLoggedIn(),
				loading: false,
			});
		});
	}, []);

	return (
		<AuthContext.Provider value={sessionState}>
			{children}
		</AuthContext.Provider>
	);
}

export function useAuth() {
	return useContext(AuthContext);
}
