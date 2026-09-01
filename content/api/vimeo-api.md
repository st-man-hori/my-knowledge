---
title: Vimeo API
date: 2026-09-01
tags: api, vimeo
---

Vimeo APIは、Vimeoの動画やユーザー情報などにアクセスするためのRESTful APIです。

Vimeo APIを利用することで、Vimeoへの動画のアップロードやリンクの取得、動画情報の編集などが可能です。

https://developer.vimeo.com/api/guides/start

https://developer.vimeo.com/api/reference

## SDK/Library

公式SDK/Libraryはサーバー向けとしてはPHP,Python,Node.jsのみとなります。

[PHP SDK](https://github.com/vimeo/vimeo.php)  
[Python SDK](https://github.com/vimeo/vimeo.py)  
[Node.js SDK](https://github.com/vimeo/vimeo.js)  

フレームワーク向けとしてはLaravelのみ提供されています。  
[Laravel SDK](https://github.com/vimeo/laravel)

非公式SDK/Libraryもいくつか存在します。  
[Go SDK](https://github.com/silentsokolov/go-vimeo)  
[Java SDK](https://github.com/clickntap/Vimeo)  

## 認証

Vimeo APIはOAuth2で認証します。トークンの取得方法は用途に応じて2通りあります。

### Personal Access Token（自分のアカウントに対して操作する場合）

[Vimeo Developer Portal](https://developer.vimeo.com/apps)のApp管理画面から、`Generate Access Token`でその場で発行できます。自分のアカウントの動画だけを扱うのであればこの方法が手軽です。

発行時に以下を選択します。

- **Authenticated / Unauthenticated**
  - Authenticated: 自分のアカウントに紐づき、非公開データにもアクセス可能
  - Unauthenticated: アプリ単位の認可で、公開データの読み取りのみ可能
- **Scope**: `public`, `private`, `edit`, `upload`など、トークンに与える権限を個別に選択。非公開動画やメタデータを扱うには`private`スコープが必須

### Authorization Code Grant（第三者ユーザーの代理で操作する場合）

自分以外のVimeoユーザーの動画をアプリ経由で操作させたい場合は、通常のOAuth2 Authorization Codeフローを実装します。

1. `buildAuthorizationEndpoint()`で認可エンドポイントのURLを生成し、ユーザーをリダイレクトする
2. ユーザーがVimeo側で認可すると、指定したredirect URIに`code`と`state`付きでコールバックされる
3. `code`をアクセストークンと交換する

PHP SDKでは以下のように書けます。

```php
// 認可エンドポイントへのリンクを生成
$lib = new \Vimeo\Vimeo($client_id, $client_secret);
$authorizeUrl = $lib->buildAuthorizationEndpoint($redirect_uri, 'public', $state);

// コールバックで受け取ったcodeをアクセストークンに交換
$tokens = $lib->accessToken($_GET['code'], $redirect_uri);
if ($tokens['status'] == 200) {
    $access_token = $tokens['body']['access_token'];
}
```

`state`パラメータはCSRF対策用のランダム文字列で、コールバック時に自分が発行した値と一致するか検証する必要があります。

## 使い方(PHP)

### インストール

```sh
composer require vimeo/vimeo-api
```

### 動画のアップロード〜編集

アクセストークンを取得したら、`Vimeo`インスタンスに渡してAPIを呼び出します。アップロードはmultipartではなく、Vimeo独自の[tus](https://tus.io/)ベースのアップロードAPIをSDKが内部でラップしています。

```php
use Vimeo\Vimeo;
use Vimeo\Exceptions\VimeoUploadException;

$lib = new Vimeo($client_id, $client_secret, $access_token);

try {
    // 動画をアップロードし、タイトルと説明を同時に設定
    $uri = $lib->upload('/path/to/video.mp4', [
        'name' => 'サンプル動画',
        'description' => 'PHP SDK経由でアップロードした動画です。',
    ]);

    // アップロード直後にvimeo.comのURLを取得
    $video = $lib->request($uri . '?fields=link');
    echo $video['body']['link'];

    // タイトル・説明を後から編集
    $lib->request($uri, [
        'name' => '編集後のタイトル',
    ], 'PATCH');

    // トランスコード状況を確認
    $status = $lib->request($uri . '?fields=transcode.status');
    echo $status['body']['transcode']['status'];
} catch (VimeoUploadException $e) {
    echo 'アップロードに失敗しました: ' . $e->getMessage();
}
```

`upload()`はファイルサイズに応じて自動的にチャンク分割してアップロードするため、大きな動画ファイルでも呼び出し側で分割処理を書く必要はありません。

### 汎用的なAPI呼び出し

アップロード以外の一般的なCRUD操作は、`request()`にエンドポイントとHTTPメソッドを指定するだけで行えます。

```php
// 自分の動画一覧を取得
$videos = $lib->request('/me/videos', ['per_page' => 10], 'GET');

// 動画を削除
$lib->request('/videos/12345678', [], 'DELETE');
```

さらに詳しい使用例は以下も参考にしてください。

https://developer.vimeo.com/api/libraries/examples