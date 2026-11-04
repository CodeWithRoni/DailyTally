package io.ahroni.dailytally;

import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialException;
import androidx.core.content.ContextCompat;
import androidx.fragment.app.FragmentActivity;
import com.google.android.libraries.identity.googleid.GetSignInWithGoogleOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;
import org.json.JSONObject;

final class GoogleAuthenticator {
 private static void error(DeviceAuthenticator.Result result,String message){try{result.receive(new JSONObject().put("error",message));}catch(Exception ignored){}}
 static void signIn(FragmentActivity activity,String clientId,String nonce,DeviceAuthenticator.Result result){
  try{
   if(!clientId.endsWith(".apps.googleusercontent.com")||!nonce.matches("[A-Za-z0-9_-]{40,100}"))throw new IllegalArgumentException();
   GetSignInWithGoogleOption option=new GetSignInWithGoogleOption.Builder(clientId).setNonce(nonce).build();
   GetCredentialRequest request=new GetCredentialRequest.Builder().addCredentialOption(option).build();
   CredentialManager.create(activity).getCredentialAsync(activity,request,null,ContextCompat.getMainExecutor(activity),new CredentialManagerCallback<GetCredentialResponse,GetCredentialException>(){
    @Override public void onResult(GetCredentialResponse response){try{if(!(response.getCredential() instanceof CustomCredential))throw new IllegalArgumentException();CustomCredential credential=(CustomCredential)response.getCredential();if(!GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(credential.getType()))throw new IllegalArgumentException();GoogleIdTokenCredential token=GoogleIdTokenCredential.createFrom(credential.getData());result.receive(new JSONObject().put("token",token.getIdToken()));}catch(Exception failure){error(result,"Google sign-in failed. Please try again.");}}
    @Override public void onError(GetCredentialException failure){error(result,"Google sign-in was cancelled or is unavailable. Check Google Play services and the Android OAuth configuration, then try again.");}
   });
  }catch(Exception failure){error(result,"Google sign-in is unavailable. Please try again.");}
 }
}
