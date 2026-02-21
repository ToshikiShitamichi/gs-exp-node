const express = require("express")
// → Express: Webサーバーを作るフレームワーク
//   app.get(), app.post() などでAPIを定義できる

const cors = require("cors");
// → CORS: 異なるドメイン間の通信を許可
//   Next.js（localhost:3000）からAPI（localhost:5000）にアクセスできるようにする

const { PrismaClient } = require("./generated/prisma");
// → Prisma Client: データベースを操作するためのクラス
//   prisma.post.findMany() などでCRUD操作ができる

// ========================================
// 初期化
// ========================================

const app = express()
const PORT = 8888

const prisma = new PrismaClient();
// → Prisma Client のインスタンスを作成
//   この prisma を使ってDBを操作する

// ========================================
// ミドルウェアの設定
// ========================================
// ミドルウェア = リクエストを処理する前に実行される関数
// 全てのリクエストに対して共通の処理を行う

app.use(cors());
// → CORS を許可
//   これがないと Next.js から API にアクセスできない

app.use(express.json());
// → JSON リクエストを解析
//   req.body でJSONデータを受け取れるようにする

app.get("/", (req, res) => {
    res.send("<h1>おおほりは長野で研究しています</h1>")
})

// ========================================
// app.メソッド("/パス", async (req, res) => {
//     try {
//         // 1. リクエストからデータを取り出す
//         const { } = req.body;
//
//         // 2. Prisma でDB操作
//         const xxx = await prisma.テーブル.処理({
//
//           });
//         // 3. 結果を返す
//         res.json(xxx);
//         res.status(201).json(xxx); // 201 = 作成成功
//
//     } catch (error) {
//         // エラー時の処理
//         console.error("エラーメッセージ", error);
//         res.status(500).json({ error: "エラーメッセージ" }); // 500 = サーバーエラー
//     }
// });
// ========================================

// ========================================
// 投稿作成 API
// ========================================
// POST /api/posts にアクセスしたときの処理

app.post("/api/posts", async (req, res) => {
    try {
        // 1. リクエストからデータを取り出す
        const { content, imageUrl, userId } = req.body

        if (!content || content.trim() === "") {
            return res.status(400).json({
                error: "投稿の中身が空なので入力してください"
            })
        }

        // 2. Prisma でDB操作
        const post = await prisma.post.create({
            // prisma.post.create() = 新しいデータを作成
            data: {
                content: content.trim(),
                imageUrl: imageUrl || null,
                userId: userId || null
            }
        })

        // 3. 結果を返す
        res.status(201).json(post)
    } catch (error) {
        // エラー時の処理
        console.log("Error creating post:", error);
        res.status(500).json({ error: "投稿の作成に失敗しました" })
    }
})

// ========================================
// 投稿一覧取得 API
// ========================================
// GET /api/posts にアクセスしたときの処理

app.get("/api/posts", async (req, res) => {
    try {
        // 2. Prisma でDB操作
        const posts = await prisma.post.findMany({
            orderBy: { createdAt: "desc" }
        })

        // 3. 結果を返す
        res.json(posts)

    } catch (error) {
        // エラー時の処理
        console.error("Error fetching posts:", error);
        res.status(500).json({ error: "投稿の取得に失敗しました" });
    }
});

// ========================================
// 投稿削除 API
// ========================================
// DELETE /api/posts/:id にアクセスしたときの処理
// :id = パスパラメータ（URL の一部として ID を受け取る）

app.delete("/api/posts/:id", async (req, res) => {
    try {
        // 1. リクエストからデータを取り出す
        const id = parseInt(req.params.id);

        if (isNaN(id)) {
            return res.status(400).json({ error: "無効なIDです" });
        }

        // 2. Prisma でDB操作
        await prisma.post.delete({
            where: { id },
        });

        // 3. 結果を返す
        res.json({ message: "投稿を削除しました" });

    } catch (error) {
        // エラー時の処理
        console.error("Error deleting post:", error);
        if (error.code === "P2025") {
            // P2025 = Prisma のエラーコード（レコードが見つからない）
            return res.status(404).json({ error: "投稿が見つかりません" });
            // → 404 = Not Found
        }

        res.status(500).json({ error: "投稿の削除に失敗しました" });
    }
});


// ========================================
// サーバー起動
// ========================================

app.listen(PORT, () => {
    // app.listen() = 指定したポートでサーバーを起動
    // 第1引数: ポート番号
    // 第2引数: 起動完了時に実行されるコールバック関数
    console.log(`Server is running on http://localhost:${PORT}`);
})