---
title: SOLID原則 - 単一責任の原則
description: SOLID原則の一つである単一責任の原則について解説します。
created: 2026-11-01
tags: SOLID, 単一責任の原則, 設計原則, プログラミング
---

# SOLID原則とは

アメリカのソフトウェアエンジニアであるロバート・C・マーチンが提唱した、ソフトウェア設計の原則の総称です。SOLIDは以下の5つの原則の頭文字を取ったものです。

- S: 単一責任の原則 (Single Responsibility Principle)
- O: 開放/閉鎖の原則 (Open/Closed Principle)
- L: リスコフの置換原則 (Liskov Substitution Principle)
- I: インターフェース分離の原則 (Interface Segregation Principle)
- D: 依存関係逆転の原則 (Dependency Inversion Principle)

これらの原則は、理解しやすく、拡張しやすく、保守しやすい設計を実現するための指針となります。

今回はその中でも単一責任の原則について解説します。

# 単一責任の原則とは

定義としては「クラスを変更する理由は、ただ1つであるべきである」というものです。
クラス、関数、モジュールはそれぞれ1つの責任だけを持つべきである、ということにもつながります。

ただし、「1つのクラスには1つの役割しか持たせない」という理解は誤解です。マーチン自身も後の著書『Clean Architecture』で、「モジュールはたった1つのアクター（利用者）に対して責務を負うべきである」と言い換えています。重要なのは「1つのクラスは1つのアクター（変更を要求する人や部署）や機能に対してのみ責任を持つ」という点です。

これにより、クラスが変更される理由が明確になり、変更の影響範囲を最小限に抑えることができます。結果として、コードの保守性や再利用性が向上します。

## コード例

ECサイトの注文確定APIをLaravelで実装した場合を例とします。

### ❌ 違反例: 1つのクラスが複数のアクター（利用者）に対して責任を持っている

```php
<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Facades\Mail;

class OrderService
{
    public function complete(Order $order): void
    {
        // ① 金額計算(経理・営業部門の都合で変わる)
        $subtotal = $order->items->sum(fn ($i) => $i->price * $i->quantity);
        $tax = (int) floor($subtotal * 0.10);
        $shipping = $subtotal >= 5000 ? 0 : 500;
        $total = $subtotal + $tax + $shipping;

        // ② 保存(DB設計の都合で変わる)
        $order->update(['total' => $total, 'status' => 'completed']);

        // ③ 通知(マーケティング・CS部門の都合で変わる)
        Mail::raw("ご注文ありがとうございます。合計: {$total}円", function ($m) use ($order) {
            $m->to($order->user->email)->subject('注文確認');
        });
    }
}
```

上記例では下記の問題があります。

- 経理・営業部門の都合による送料ルールの変更、CS部門の都合によるメール通知の変更、DB設計の都合による保存処理の変更など、複数の理由でクラスが変更される可能性がある
- 1つの修正で他の処理に影響を与える可能性がある
- テストが困難になる可能性がある（金額計算のテストをする際にDBやメール送信が絡んでしまう）

なお、「保存」はアクターというよりも技術的な関心事ですが、ここでは変更理由が異なる処理の例として並べています。

### ✅ 改善例: 責任を分割したクラス設計

#### ① 金額計算

```php
<?php

namespace App\Services\Order;

use App\Models\Order;

class OrderPriceCalculator
{
    private const TAX_RATE = 0.10;
    private const FREE_SHIPPING_THRESHOLD = 5000;
    private const SHIPPING_FEE = 500;

    public function calculate(Order $order): int
    {
        $subtotal = $order->items->sum(fn ($i) => $i->price * $i->quantity);
        $tax = (int) floor($subtotal * self::TAX_RATE);
        $shipping = $subtotal >= self::FREE_SHIPPING_THRESHOLD ? 0 : self::SHIPPING_FEE;

        return $subtotal + $tax + $shipping;
    }
}
```

金額計算の責任を `OrderPriceCalculator` クラスに分割しました。これにより、金額計算の変更が他の処理に影響を与えることなく行えるようになります。

#### ② 通知

```php
<?php

namespace App\Services\Order;

use App\Models\Order;
use Illuminate\Support\Facades\Mail;

class OrderConfirmationNotifier
{
    public function notify(Order $order): void
    {
        Mail::raw("ご注文ありがとうございます。合計: {$order->total}円", function ($m) use ($order) {
            $m->to($order->user->email)->subject('注文確認');
        });
    }
}
```

先ほどの金額計算と同様に、通知の責任も `OrderConfirmationNotifier` クラスに分割しました。これにより、通知の変更が他の処理に影響を与えることなく行えるようになります。

なお、このクラスは `$order->total` を参照するため、金額が保存された後の注文を渡す必要があります。

#### ③ 注文確定の流れ

```php
<?php

namespace App\Services\Order;

use App\Models\Order;

class CompleteOrderService
{
    public function __construct(
        private OrderPriceCalculator $calculator,
        private OrderConfirmationNotifier $notifier,
    ) {}

    public function execute(Order $order): void
    {
        $order->update([
            'total' => $this->calculator->calculate($order),
            'status' => 'completed',
        ]);

        $this->notifier->notify($order);
    }
}
```

`CompleteOrderService` クラスは、注文確定の流れを統括する責任を持ちます。金額計算や通知の処理はそれぞれ専用のクラスに委譲されるため、各処理の変更が他の処理に影響を与えることなく行えるようになります。

「更新（update）してから通知する」という順序は、このクラスが責任を持って管理します。実装によっては、update をリポジトリクラスなどに委譲することも考えられます。

#### ④ レスポンス

```php
<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'status' => $this->status,
            'total' => $this->total,
        ];
    }
}
```

リソースクラスを用いることで、レスポンスの形式を変更する際に他の処理に影響を与えることなく行えるようになります。

#### ⑤ コントローラー

```php
<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Resources\OrderResource;
use App\Models\Order;
use App\Services\Order\CompleteOrderService;

class OrderController extends Controller
{
    public function complete(Order $order, CompleteOrderService $service): OrderResource
    {
        $service->execute($order);

        return new OrderResource($order->refresh());
    }
}
```

コントローラーは、HTTPの入出力の責任のみを持ちます。リクエストを受け取り、サービスクラスを呼び出し、レスポンスを返す役割を担うため、コントローラーの変更が他の処理に影響を与えることなく行えるようになります。

## コード例による改善で得られる効果

前述のコード例では、各処理を専用のクラスに分割することで、以下のような効果が得られます。

- 変更の影響範囲を限定できる。たとえば送料無料の基準額を変更する場合でも、金額計算のロジックが `OrderPriceCalculator` クラスに集約されているため、他の処理に影響を与えずに変更できる。
- テストが容易になる。各クラスを個別にテストできるため、バグの特定が容易になる。
- コードの可読性が向上する。処理の流れが明確になり、理解しやすくなる。

## 注意点

なんでもかんでもクラスに分割してしまうと、ファイルが増えすぎて管理が煩雑になる可能性があります。そのため、責任の分割は適切な粒度で行うことが重要です。

ポイントはアクターごとの責任を意識することです。同じアクターの都合で同時に変わるものは同じクラスにまとめる、という粒度で責任を分割すると、管理が煩雑になりすぎずに済みます。

### 分けすぎた例

先ほどの `OrderPriceCalculator` を、次のようにさらに細かく分割した場合を考えてみます。

#### ❌ 分けすぎた例

```php
<?php

namespace App\Services\Order;

class TaxCalculator
{
    public function calculate(int $subtotal): int
    {
        return (int) floor($subtotal * 0.10);
    }
}
```

```php
<?php

namespace App\Services\Order;

class ShippingFeeCalculator
{
    public function calculate(int $subtotal): int
    {
        return $subtotal >= 5000 ? 0 : 500;
    }
}
```

```php
<?php

namespace App\Services\Order;

use App\Models\Order;

class OrderPriceCalculator
{
    public function __construct(
        private TaxCalculator $taxCalculator,
        private ShippingFeeCalculator $shippingFeeCalculator,
    ) {}

    public function calculate(Order $order): int
    {
        $subtotal = $order->items->sum(fn ($i) => $i->price * $i->quantity);

        return $subtotal
            + $this->taxCalculator->calculate($subtotal)
            + $this->shippingFeeCalculator->calculate($subtotal);
    }
}
```

一見きれいに見えますが、税率も送料ルールも**どちらも経理・営業部門の都合で変わるもの**です。別々のクラスに分けると、変更の影響範囲が同じにもかかわらず、複数のクラスを修正する必要が出てきてしまいます。

そのため、改善例①のようなまとめ方が望ましいと言えます。

ただし、状況の変化に応じて分割が適切となることもあります。
例えば、税金の計算が海外税制に対応する必要が出てきた場合は、法務と経理の都合で変更が必要になるため、税金計算を別のクラスに分けることが適切になる場合があります。

## まとめ

単一責任の原則は、「1つのクラスが1つの処理だけを担う」ということではなく、**1つのアクターに対して1つの責任のみを持つべき**という考え方です。これにより、変更の影響範囲を限定し、コードの保守性や可読性を向上させることができます。

## 理解度チェック（AI生成）

以下の4択問題で、単一責任の原則の理解度をチェックしてみましょう。答えは折りたたまれているので、クリックして確認してください。

**Q1. 単一責任の原則の説明として、最も適切なものはどれか？**
1. 1つのクラスには1つのメソッドだけを持たせるべきである
2. 1つのクラスは1つの処理だけを担うべきである
3. 1つのクラスが変更される理由は、1つのアクター（変更を要求する人や部署）に由来するものだけであるべきである
4. 1つのクラスは他のクラスに依存してはならない

> [!success]- 答えを見る
> **正解: 3. 1つのクラスが変更される理由は、1つのアクター（変更を要求する人や部署）に由来するものだけであるべきである**
> 「1つのクラスに1つの処理（役割）」というのはよくある誤解です。本質は「誰の都合で変わるのか」であり、同じアクターの都合で変わる処理であれば、複数の処理を1つのクラスに持たせても問題ありません。

**Q2. 次のうち、単一責任の原則に違反している可能性が最も高いクラスはどれか？**
1. 税率と送料ルールをもとに注文金額を計算する `OrderPriceCalculator`
2. 給与計算（経理部門が管理）と勤務時間レポートの出力（人事部門が管理）の両方を行う `Employee`
3. 計算と通知のクラスを呼び出して、処理の順序だけを管理する `CompleteOrderService`
4. ユーザー情報をJSONの形に整形して返す `UserResource`

> [!success]- 答えを見る
> **正解: 2. 給与計算（経理部門が管理）と勤務時間レポートの出力（人事部門が管理）の両方を行う `Employee`**
> 経理部門と人事部門という異なるアクターの都合で変更されるため、一方の変更がもう一方に影響するおそれがあります。1は税率も送料も同じアクター（経理・営業）の都合で変わるため、1つのクラスにまとまっていて問題ありません。

**Q3. ブログ記事を扱う `Article` クラスに「本文のMarkdownをHTMLに変換する処理」と「記事をDBに保存する処理」が同居している。単一責任の原則の観点から最も適切な判断はどれか？**
1. メソッドが2つしかないので、分割する必要はない
2. 表示の仕様変更とDB設計の変更は異なる理由で起こるため、分割を検討すべきである
3. 両方とも記事に関する処理なので、同じクラスにあるのが正しい
4. 全てのメソッドを1メソッド1クラスに分割すべきである

> [!success]- 答えを見る
> **正解: 2. 表示の仕様変更とDB設計の変更は異なる理由で起こるため、分割を検討すべきである**
> 判断基準はメソッドの数や「同じデータを扱っているか」ではなく、「変更される理由が同じか」です。表示の仕様とDB設計は別々の都合で変わるため、変更理由が複数あることになります。

**Q4. 単一責任の原則に従ってクラスを分割する際の考え方として、最も適切なものはどれか？**
1. クラスは細かく分ければ分けるほど良い
2. 同じアクターの都合で同時に変わるものは同じクラスにまとめ、異なるアクターの都合で変わるものは分ける
3. 1つのクラスの行数が100行を超えたら分割する
4. 一度決めたクラスの分割は、要件が変わっても変更すべきではない

> [!success]- 答えを見る
> **正解: 2. 同じアクターの都合で同時に変わるものは同じクラスにまとめ、異なるアクターの都合で変わるものは分ける**
> 分けすぎると、1つの変更のために複数のクラスを修正する必要が出てきます。また、アクターが変われば適切な分割の仕方も変わるため、状況に応じて見直すことも大切です。

**Q5. 単一責任の原則を守ることで得られる効果として、適切でないものはどれか？**
1. 変更の影響範囲を限定できる
2. 各クラスを個別にテストしやすくなる
3. 処理の流れが明確になり、コードが読みやすくなる
4. クラスやファイルの数が必ず減り、管理が楽になる

> [!success]- 答えを見る
> **正解: 4. クラスやファイルの数が必ず減り、管理が楽になる**
> 責任を分割するため、クラスやファイルの数はむしろ増える傾向にあります。だからこそ、分けすぎずに適切な粒度で分割することが重要です。
