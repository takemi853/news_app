// src/components/NewsList.tsx
import React, { useEffect, useState } from 'react';
import {
  collection,
  query,
  orderBy,
  limit,
  getDocs
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { db, auth } from '../firebaseConfig';
import styles from './NewsList.module.css';

interface Analysis {
  impressiveness: string;
  competitor_difference: string;
  noteworthiness: {
    score_value: number;
    score_max: number;
    score_visual: string;
    text: string;
  };
}

interface Article {
  title: string;
  emoji: string;
  summary: string;
  source: string;
  publication_date: string;
  url: string;
  category: string[];
  analysis: Analysis;
}

export const NewsList: React.FC = () => {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 匿名認証を実行
    signInAnonymously(auth).catch(console.error);

    // 認証状態を監視し、ログイン後にデータ取得
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'news_snapshots'),
          orderBy('fetchedAt', 'desc'),
          limit(1)
        );
        const snap = await getDocs(q);
        if (snap.empty) {
          // Firestoreが空の場合はクラウドランへフォールバック
          const resp = await fetch(
            'https://news-backend-926524146817.us-central1.run.app/api/fetch-news'
          );
          if (!resp.ok) throw new Error(`API Error ${resp.status}`);
          const directArticles = (await resp.json()) as Article[];
          setArticles(directArticles);
        } else {
          const data = snap.docs[0].data() as { articles: Article[] };
          setArticles(data.articles);
        }
      } catch (e: any) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div className={styles.status}>読み込み中…</div>;
  if (error)   return <div className={styles.statusError}>エラー: {error}</div>;
  if (!articles.length) return <div className={styles.status}>記事がありません。</div>;

  return (
    <section className={styles.newsSection}>
      <div className={styles.headerBar}>
        <h1 className={styles.headerTitle}>🚀 AI News Digest</h1>
        <p className={styles.headerDesc}>Firestore から最新スナップショットを表示</p>
      </div>
      <div className={styles.cardGrid}>
        {articles.map((a, i) => {
          const href = /^https?:\/\//.test(a.url) ? a.url : `https://${a.url}`;
          return (
            <article key={i} className={styles.card}>
              <div className={styles.cardTop}>
                <div className={styles.cardEmoji}>{a.emoji}</div>
                <h2 className={styles.cardTitle}>{a.title}</h2>
              </div>
              <div className={styles.cardBody}>
                <p className={styles.cardSummary}>{a.summary}</p>
              </div>
              <div className={styles.cardMeta}>
                <span className={styles.metaItem}>📰 {a.source}</span>
                <span className={styles.metaItem}>📅 {a.publication_date}</span>
              </div>
              <ul className={styles.tagList}>
                {a.category.map((cat, idx) => (
                  <li key={idx} className={styles.tagItem}>#{cat}</li>
                ))}
              </ul>
              <a
                href={href}
                className={styles.readMore}
                target="_blank"
                rel="noopener noreferrer"
              >
                元記事へ移動
              </a>
            </article>
          );
        })}
      </div>
    </section>
  );
};
