package io.ahroni.dailytally;

import android.os.Build;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;
import java.security.KeyPairGenerator;
import java.security.KeyStore;
import java.security.Signature;
import java.security.spec.RSAKeyGenParameterSpec;
import org.json.JSONObject;

final class DeviceAuthenticator {
 interface Result {void receive(JSONObject value);}
 private static String alias(String id){if(id==null||!id.matches("[a-fA-F0-9-]{36}"))throw new IllegalArgumentException();return "DailyTally.device."+id;}
 private static int authenticators(){return BiometricManager.Authenticators.BIOMETRIC_STRONG|(Build.VERSION.SDK_INT>=30?BiometricManager.Authenticators.DEVICE_CREDENTIAL:0);}
 static boolean available(FragmentActivity activity){return BiometricManager.from(activity).canAuthenticate(authenticators())==BiometricManager.BIOMETRIC_SUCCESS;}
 static void remove(String id)throws Exception{KeyStore store=KeyStore.getInstance("AndroidKeyStore");store.load(null);store.deleteEntry(alias(id));}
 private static void error(Result result,String message){try{result.receive(new JSONObject().put("error",message));}catch(Exception ignored){}}
 static void authenticate(FragmentActivity activity,String id,String challenge,boolean enroll,Result result){
  try{
   if(challenge==null||!challenge.matches("[A-Za-z0-9_-]{40,100}"))throw new IllegalArgumentException();
   if(!available(activity)){error(result,"Set up fingerprint or a secure screen lock in your phone settings, then try again.");return;}
   String keyAlias=alias(id);KeyStore store=KeyStore.getInstance("AndroidKeyStore");store.load(null);
   if(enroll){
    if(store.containsAlias(keyAlias))throw new IllegalArgumentException();
    KeyPairGenerator generator=KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_RSA,"AndroidKeyStore");
    KeyGenParameterSpec.Builder builder=new KeyGenParameterSpec.Builder(keyAlias,KeyProperties.PURPOSE_SIGN)
     .setAlgorithmParameterSpec(new RSAKeyGenParameterSpec(2048,RSAKeyGenParameterSpec.F4))
     .setDigests(KeyProperties.DIGEST_SHA256).setSignaturePaddings(KeyProperties.SIGNATURE_PADDING_RSA_PKCS1)
     .setUserAuthenticationRequired(true);
    if(Build.VERSION.SDK_INT>=30)builder.setUserAuthenticationParameters(0,KeyProperties.AUTH_BIOMETRIC_STRONG|KeyProperties.AUTH_DEVICE_CREDENTIAL);
    else builder.setUserAuthenticationValidityDurationSeconds(-1);
    generator.initialize(builder.build());generator.generateKeyPair();
   }
   Signature signer=Signature.getInstance("SHA256withRSA");signer.initSign((java.security.PrivateKey)store.getKey(keyAlias,null));
   String publicKey=Base64.encodeToString(store.getCertificate(keyAlias).getPublicKey().getEncoded(),Base64.NO_WRAP);
   BiometricPrompt prompt=new BiometricPrompt(activity,ContextCompat.getMainExecutor(activity),new BiometricPrompt.AuthenticationCallback(){
    @Override public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult authentication){
     try{Signature verified=authentication.getCryptoObject()==null?null:authentication.getCryptoObject().getSignature();if(verified==null)throw new IllegalStateException();verified.update(challenge.getBytes(java.nio.charset.StandardCharsets.UTF_8));result.receive(new JSONObject().put("publicKey",publicKey).put("signature",Base64.encodeToString(verified.sign(),Base64.NO_WRAP)));}
     catch(Exception failure){if(enroll)try{remove(id);}catch(Exception ignored){}error(result,"Device verification failed. Please sign in with your password and enable it again.");}
    }
    @Override public void onAuthenticationError(int code,CharSequence message){if(enroll)try{remove(id);}catch(Exception ignored){}error(result,code==BiometricPrompt.ERROR_USER_CANCELED||code==BiometricPrompt.ERROR_NEGATIVE_BUTTON?"Verification cancelled. You can sign in with your password.":"Device verification is unavailable. Check your phone security settings and try again.");}
   });
   BiometricPrompt.PromptInfo.Builder info=new BiometricPrompt.PromptInfo.Builder().setTitle("DailyTally").setSubtitle("Verify to securely access your account").setAllowedAuthenticators(authenticators());
   if(Build.VERSION.SDK_INT<30)info.setNegativeButtonText("Cancel");
   prompt.authenticate(info.build(),new BiometricPrompt.CryptoObject(signer));
  }catch(Exception failure){if(enroll)try{remove(id);}catch(Exception ignored){}error(result,"Device key is unavailable. Sign in with your password and enable device login again.");}
 }
}
