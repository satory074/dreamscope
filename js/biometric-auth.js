// Biometric authentication handler

class BiometricAuth {
    constructor() {
        this.isAvailable = false;
        this.isEnabled = false;
        this.checkAvailability();
    }
    
    async checkAvailability() {
        // Check for Web Authentication API support
        if (window.PublicKeyCredential) {
            try {
                this.isAvailable = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
                
                // Check if user has enabled biometric auth
                this.isEnabled = localStorage.getItem('biometric_auth_enabled') === 'true';
                
                if (this.isAvailable && !this.isEnabled) {
                    this.promptEnableBiometric();
                }
            } catch (error) {
                console.log('Biometric auth not available:', error);
            }
        }
        
        // Fallback: Check for Touch ID / Face ID on iOS
        if (window.webkit?.messageHandlers?.biometricAuth) {
            this.isAvailable = true;
            this.useiOSBiometric = true;
        }
    }
    
    async promptEnableBiometric() {
        // Wait until user has used the app a bit
        setTimeout(() => {
            const hasSeenPrompt = localStorage.getItem('biometric_prompt_shown');
            if (!hasSeenPrompt) {
                this.showBiometricPrompt();
            }
        }, 30000); // 30 seconds
    }
    
    showBiometricPrompt() {
        const prompt = document.createElement('div');
        prompt.className = 'biometric-prompt';
        prompt.innerHTML = `
            <div class="biometric-content">
                <div class="biometric-icon">🔐</div>
                <h3>生体認証でプライバシーを保護</h3>
                <p>Face IDまたはTouch IDを使用して、あなたの夢を安全に保護しませんか？</p>
                <div class="biometric-actions">
                    <button onclick="BiometricAuth.instance.enableBiometric()" class="enable-btn">有効にする</button>
                    <button onclick="BiometricAuth.instance.dismissPrompt()" class="dismiss-btn">今はしない</button>
                </div>
            </div>
        `;
        document.body.appendChild(prompt);
        
        localStorage.setItem('biometric_prompt_shown', 'true');
    }
    
    async enableBiometric() {
        try {
            if (this.useiOSBiometric) {
                // Use iOS native biometric
                await this.enableiOSBiometric();
            } else {
                // Use Web Authentication API
                await this.registerWebAuthn();
            }
            
            localStorage.setItem('biometric_auth_enabled', 'true');
            this.isEnabled = true;
            
            this.showToast('生体認証が有効になりました', 'success');
            this.dismissPrompt();
        } catch (error) {
            console.error('Failed to enable biometric:', error);
            this.showToast('生体認証の設定に失敗しました', 'error');
        }
    }
    
    async registerWebAuthn() {
        const publicKeyCredentialCreationOptions = {
            challenge: new Uint8Array(32),
            rp: {
                name: "DreamScope",
                id: window.location.hostname,
            },
            user: {
                id: new TextEncoder().encode(this.getUserId()),
                name: "dreamscope_user",
                displayName: "DreamScope User",
            },
            pubKeyCredParams: [{alg: -7, type: "public-key"}],
            authenticatorSelection: {
                authenticatorAttachment: "platform",
                userVerification: "required"
            },
            timeout: 60000,
            attestation: "direct"
        };
        
        const credential = await navigator.credentials.create({
            publicKey: publicKeyCredentialCreationOptions
        });
        
        // Store credential ID
        localStorage.setItem('biometric_credential_id', 
            btoa(String.fromCharCode(...new Uint8Array(credential.rawId))));
    }
    
    async enableiOSBiometric() {
        // Send message to iOS app
        window.webkit.messageHandlers.biometricAuth.postMessage({
            action: 'enable'
        });
    }
    
    async authenticate() {
        if (!this.isEnabled || !this.isAvailable) {
            return true; // Skip if not enabled
        }
        
        try {
            if (this.useiOSBiometric) {
                return await this.authenticateiOS();
            } else {
                return await this.authenticateWebAuthn();
            }
        } catch (error) {
            console.error('Authentication failed:', error);
            return false;
        }
    }
    
    async authenticateWebAuthn() {
        const credentialId = localStorage.getItem('biometric_credential_id');
        if (!credentialId) {
            throw new Error('No credential found');
        }
        
        const publicKeyCredentialRequestOptions = {
            challenge: new Uint8Array(32),
            allowCredentials: [{
                id: Uint8Array.from(atob(credentialId), c => c.charCodeAt(0)),
                type: 'public-key',
                transports: ['internal']
            }],
            userVerification: "required",
            timeout: 60000
        };
        
        const assertion = await navigator.credentials.get({
            publicKey: publicKeyCredentialRequestOptions
        });
        
        return assertion !== null;
    }
    
    async authenticateiOS() {
        return new Promise((resolve) => {
            // Set up message handler
            window.biometricAuthCallback = (success) => {
                resolve(success);
                delete window.biometricAuthCallback;
            };
            
            // Request authentication
            window.webkit.messageHandlers.biometricAuth.postMessage({
                action: 'authenticate'
            });
        });
    }
    
    dismissPrompt() {
        const prompt = document.querySelector('.biometric-prompt');
        if (prompt) {
            prompt.remove();
        }
    }
    
    getUserId() {
        let userId = localStorage.getItem('user_id');
        if (!userId) {
            userId = 'user_' + Date.now();
            localStorage.setItem('user_id', userId);
        }
        return userId;
    }
    
    showToast(message, type) {
        if (window.showToast) {
            window.showToast(message, type);
        }
    }
    
    // Lock screen for sensitive data
    async requireAuthentication() {
        if (!this.isEnabled) return true;
        
        const lockScreen = document.createElement('div');
        lockScreen.className = 'lock-screen';
        lockScreen.innerHTML = `
            <div class="lock-content">
                <div class="lock-icon">🔒</div>
                <h2>認証が必要です</h2>
                <p>夢の記録を見るには認証してください</p>
                <button onclick="BiometricAuth.instance.unlock()" class="unlock-btn">
                    ロックを解除
                </button>
            </div>
        `;
        document.body.appendChild(lockScreen);
        
        return new Promise((resolve) => {
            this.unlockCallback = resolve;
        });
    }
    
    async unlock() {
        const authenticated = await this.authenticate();
        
        if (authenticated) {
            const lockScreen = document.querySelector('.lock-screen');
            if (lockScreen) {
                lockScreen.classList.add('unlocking');
                setTimeout(() => lockScreen.remove(), 300);
            }
            
            if (this.unlockCallback) {
                this.unlockCallback(true);
                this.unlockCallback = null;
            }
        } else {
            this.showToast('認証に失敗しました', 'error');
            if (this.unlockCallback) {
                this.unlockCallback(false);
                this.unlockCallback = null;
            }
        }
    }
}

// Create singleton instance
BiometricAuth.instance = new BiometricAuth();

// Add styles
const style = document.createElement('style');
style.textContent = `
.biometric-prompt {
    position: fixed;
    bottom: 20px;
    left: 20px;
    right: 20px;
    background: var(--surface-elevated);
    border-radius: 20px;
    padding: 1.5rem;
    box-shadow: 0 10px 30px var(--shadow);
    z-index: 1001;
    animation: slideUp 0.3s ease-out;
}

.biometric-content {
    text-align: center;
}

.biometric-icon {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.biometric-prompt h3 {
    color: var(--text-primary);
    margin-bottom: 0.5rem;
}

.biometric-prompt p {
    color: var(--text-secondary);
    margin-bottom: 1.5rem;
}

.biometric-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
}

.enable-btn {
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    color: white;
    border: none;
    padding: 0.8rem 2rem;
    border-radius: 25px;
    font-weight: bold;
    cursor: pointer;
}

.lock-screen {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: var(--background-color);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
}

.lock-screen.unlocking {
    animation: fadeOut 0.3s ease-out;
}

.lock-content {
    text-align: center;
    padding: 2rem;
}

.lock-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
}

.unlock-btn {
    background: linear-gradient(135deg, var(--primary-color), var(--secondary-color));
    color: white;
    border: none;
    padding: 1rem 3rem;
    border-radius: 30px;
    font-size: 1.1rem;
    font-weight: bold;
    cursor: pointer;
    margin-top: 2rem;
}

@keyframes slideUp {
    from {
        transform: translateY(100%);
        opacity: 0;
    }
    to {
        transform: translateY(0);
        opacity: 1;
    }
}

@keyframes fadeOut {
    to {
        opacity: 0;
    }
}
`;
document.head.appendChild(style);