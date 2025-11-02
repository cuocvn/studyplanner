# StudyPlanner
StudyPlanner — web nhỏ giúp chia lịch ôn tập tự động.

## Quick start
1. Thêm file, chỉnh `firebase-init.js` với config của bạn.
2. Mở Firebase Console: bật Authentication (Google) và Firestore (test mode lúc dev).
3. Commit & push lên GitHub.
4. Deploy lên Vercel (static site) hoặc Netlify.

## Deploy
- Vercel: import repo -> framework: Other (static) -> deploy.

## Lưu ý bảo mật
- Khi ready production, chỉnh Firestore rules theo file `firestore.rules`.
