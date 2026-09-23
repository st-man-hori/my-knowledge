---
title: Exponential Backoff(指数バックオフ)について
description: Exponential Backoff(指数バックオフ)の概念について解説します。
created: 2026-09-23
tags: exponential-backoff, retry, api
---

Exponential Backoff(以降 指数バックオフ)は、APIリクエストなどにおいて、失敗した場合に再試行を行う際の待機時間を指数関数的に増加させる手法です。  
サーバーへの負荷を軽減し、通信の成功率を向上させることができます。

指数関数とは1,2,4,8,16...のように足し算ではなく、前の値に一定の数を掛けて増加していく関数のことを指します。

例えば、初回の待機時間を1秒とした場合、再試行のたびに2倍、4倍、8倍と増加していきます。  

![指数バックオフの図](/images/exponential-backoff.svg)

## 実装例

分かりやすくVanilla JavaScriptでの実装例を示します。

```javascript
function exponentialBackoff(retryCount) {
    const baseDelay = 1000; // 1秒
    // Math.pow(x, y)はxのy乗を計算する関数
    return baseDelay * Math.pow(2, retryCount);
}

const maxRetries = 4; // 最大リトライ回数

function makeRequest(retryCount = 0) {
    fetch('https://api.example.com/data')
        .then(response => {
            if (!response.ok) {
                throw new Error('Request failed');
            }
            return response.json();
        })
        .then(data => {
            console.log('Success:', data);
        })
        .catch(error => {
            // 上限に達したら諦める
            if (retryCount >= maxRetries) {
                console.error('Max retries reached:', error);
                return;
            }
            const delay = exponentialBackoff(retryCount);
            console.log('Retrying in', delay, 'ms');
            setTimeout(() => {
                makeRequest(retryCount + 1);
            }, delay);
        });
}

makeRequest();
```

1回目の失敗では2の0乗で1秒、2回目の失敗では2の1乗で2秒、3回目の失敗では2の2乗で4秒、4回目の失敗では2の3乗で8秒と、再試行のたびに待機時間が指数関数的に増加していきます。  
5回目も失敗した場合は、リトライ回数が上限(`maxRetries`)に達しているため、それ以上は再試行せずに処理を終了します。

リトライ回数を`makeRequest`の引数で受け渡しているので、次に`makeRequest()`を呼び出したときは、またリトライ0回の状態から始まります。

## ユースケース

指数バックオフは、以下のような状況で有効です。

- ネットワークが不安定な場合のAPIリクエストの再試行
- サーバーが一時的に高負荷状態にある場合のリクエストの再試行
- 分散システムにおけるリソース競合の回避

429 Too Many Requestsや500 Internal Server Errorのような一時的なエラーに対して、指数バックオフを用いた再試行を行うことで、システムの安定性を保ちながらリクエストの成功率を向上させることができます。

## 注意点

指数バックオフを実装する際には、以下の点に注意する必要があります。

- 最大待機時間を設定する: 待機時間が無限に増加しないように、上限を設けることが重要です。
- ジッターを導入する: 同時に複数のクライアントが再試行する場合、待機時間にランダムな揺らぎ（ジッター）を加えることで、リクエストの集中を避けることができます。

![ジッターの図](/images/exponential-backoff-jitter.svg)

## 理解度チェック（AI生成）

以下の4択問題で、指数バックオフの理解度をチェックしてみましょう。答えは折りたたまれているので、クリックして確認してください。

**Q1. 初回の待機時間を1秒、倍率を2とした指数バックオフで、4回目の失敗後に待機する時間はどれか？**
1. 4秒
2. 6秒
3. 8秒
4. 16秒

> [!success]- 答えを見る
> **正解: 3. 8秒**
> 待機時間は失敗するたびに1秒 → 2秒 → 4秒 → 8秒と2倍ずつ増えていくため、4回目の失敗後は2の3乗で8秒待機します。

**Q2. 指数バックオフにジッターを導入する目的として正しいものはどれか？**
1. 待機時間を短くして、リクエストの成功を早めるため
2. 複数のクライアントの再試行タイミングをずらし、リクエストの集中を避けるため
3. 再試行の回数に上限を設けるため
4. 失敗したリクエストの内容を自動で修正するため

> [!success]- 答えを見る
> **正解: 2. 複数のクライアントの再試行タイミングをずらし、リクエストの集中を避けるため**
> ジッターがないと、同時に失敗した複数のクライアントが同じタイミングで再試行してしまい、サーバーにリクエストが集中します。待機時間にランダムな揺らぎを加えることで、再試行のタイミングを分散させられます。
