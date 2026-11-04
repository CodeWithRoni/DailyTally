import UIKit
import WebKit
@main class AppDelegate: UIResponder, UIApplicationDelegate {
 var window: UIWindow?
 func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
  let w = UIWindow(frame: UIScreen.main.bounds);w.rootViewController = LedgerController();w.makeKeyAndVisible();window = w;return true
 }
}
class LedgerController: UIViewController, WKNavigationDelegate, WKUIDelegate, WKScriptMessageHandler, WKDownloadDelegate {
 var web: WKWebView!; var downloaded: URL?
 func trusted(_ url: URL) -> Bool { url.scheme == "https" && url.host == DailyTallyConfig.url.host && (url.port == nil || url.port == 443) }
 func external(_ url: URL) { if ["https", "mailto", "tel"].contains(url.scheme ?? "") { UIApplication.shared.open(url) } }
 override func viewDidLoad() {
  super.viewDidLoad();view.backgroundColor = UIColor(red:0.06,green:0.25,blue:0.18,alpha:1)
  let config = WKWebViewConfiguration();config.websiteDataStore = .default();config.userContentController.add(self,name:"dailyPrint");config.userContentController.addUserScript(WKUserScript(source:"window.print=()=>window.webkit.messageHandlers.dailyPrint.postMessage('print')",injectionTime:.atDocumentEnd,forMainFrameOnly:true))
  web = WKWebView(frame:.zero,configuration:config);web.navigationDelegate = self;web.uiDelegate = self;web.allowsBackForwardNavigationGestures = true;web.translatesAutoresizingMaskIntoConstraints = false;view.addSubview(web)
  NSLayoutConstraint.activate([web.topAnchor.constraint(equalTo:view.safeAreaLayoutGuide.topAnchor),web.bottomAnchor.constraint(equalTo:view.safeAreaLayoutGuide.bottomAnchor),web.leadingAnchor.constraint(equalTo:view.leadingAnchor),web.trailingAnchor.constraint(equalTo:view.trailingAnchor)]);web.load(URLRequest(url:DailyTallyConfig.url))
 }
 func webView(_ webView: WKWebView, decidePolicyFor navigationAction: WKNavigationAction, decisionHandler: @escaping (WKNavigationActionPolicy) -> Void) {
  guard let url = navigationAction.request.url else {decisionHandler(.cancel);return}
  if navigationAction.shouldPerformDownload && (trusted(url) || url.scheme == "blob") {decisionHandler(.download);return}
  if trusted(url) || url.absoluteString == "about:blank" {decisionHandler(.allow)} else {decisionHandler(.cancel);external(url)}
 }
 func webView(_ webView: WKWebView, createWebViewWith configuration: WKWebViewConfiguration, for navigationAction: WKNavigationAction, windowFeatures: WKWindowFeatures) -> WKWebView? {if let url = navigationAction.request.url {external(url)};return nil}
 func webView(_ webView: WKWebView, runJavaScriptAlertPanelWithMessage message:String, initiatedByFrame frame:WKFrameInfo, completionHandler:@escaping () -> Void) {let alert = UIAlertController(title:"DailyTally",message:message,preferredStyle:.alert);alert.addAction(UIAlertAction(title:"OK",style:.default){_ in completionHandler()});present(alert,animated:true)}
 func webView(_ webView:WKWebView,runJavaScriptConfirmPanelWithMessage message:String,initiatedByFrame frame:WKFrameInfo,completionHandler:@escaping (Bool)->Void){let alert=UIAlertController(title:"DailyTally",message:message,preferredStyle:.alert);alert.addAction(UIAlertAction(title:"Cancel",style:.cancel){_ in completionHandler(false)});alert.addAction(UIAlertAction(title:"Continue",style:.default){_ in completionHandler(true)});present(alert,animated:true)}
 func userContentController(_ userContentController:WKUserContentController,didReceive message:WKScriptMessage){guard message.frameInfo.isMainFrame,let url=web.url,trusted(url) else{return};let controller=UIPrintInteractionController.shared;controller.printFormatter=web.viewPrintFormatter();controller.present(animated:true,completionHandler:nil)}
 func webView(_ webView:WKWebView,navigationAction:WKNavigationAction,didBecome download:WKDownload){download.delegate=self}
 func webView(_ webView:WKWebView,navigationResponse:WKNavigationResponse,didBecome download:WKDownload){download.delegate=self}
 func download(_ download:WKDownload,decideDestinationUsing response:URLResponse,suggestedFilename:String,completionHandler:@escaping (URL?)->Void){let folder=FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString,isDirectory:true);do{try FileManager.default.createDirectory(at:folder,withIntermediateDirectories:true);let destination=folder.appendingPathComponent((suggestedFilename as NSString).lastPathComponent);downloaded=destination;completionHandler(destination)}catch{completionHandler(nil)}}
 func downloadDidFinish(_ download:WKDownload){guard let file=downloaded else{return};let share=UIActivityViewController(activityItems:[file],applicationActivities:nil);share.popoverPresentationController?.sourceView=view;share.popoverPresentationController?.sourceRect=CGRect(x:view.bounds.midX,y:view.bounds.midY,width:1,height:1);present(share,animated:true)}
 func download(_ download:WKDownload,didFailWithError error:Error,resumeData:Data?){downloaded=nil}
 func webView(_ webView:WKWebView,didFailProvisionalNavigation navigation:WKNavigation!,withError error:Error){if (error as NSError).code == NSURLErrorCancelled || presentedViewController != nil{return};let alert=UIAlertController(title:"Unable to connect",message:"Check your internet connection. The server may take a little time to start.",preferredStyle:.alert);alert.addAction(UIAlertAction(title:"Retry",style:.default){_ in self.web.load(URLRequest(url:DailyTallyConfig.url))});present(alert,animated:true)}
}
