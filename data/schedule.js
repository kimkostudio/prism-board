// PRISM 일정 데이터 — 이 파일만 고치면 사이트 전체가 갱신된다.
// 공개 사이트: 클라이언트·에이전시·제품·행사명, 콘티 내용을 쓰지 않는다.
//
// milestones: 팀 전체 일정
//   { date, end?, title, kind, status, note? }
//   kind   = meeting(미팅) | review(제출·시사) | feedback(클라이언트 FB) | qc(화질검수) | delivery(납품) | internal(내부)
//   status = confirmed(확정) | tentative(예정·미확정) | done(완료)
// assignments: 작업자별 일정
//   { person: team.js의 id, start, end, title, kind, status?, note? }
//   kind   = work(작업) | off(휴무·불가) | hold(홀드)
window.SCHEDULE = {
  updated: '2026-11-09',
  source: '11/03 PPM 일정표 · 11/09 에이전시 미팅 기준 (시사 결과·클라이언트 일정에 따라 변동 가능)',
  range: { start: '2026-10-19', end: '2027-01-10' },

  milestones: [
    { date: '2026-10-26', title: '에이전시 미팅', kind: 'meeting', status: 'done' },
    { date: '2026-11-02', title: '최종 PPM (에이전시)', kind: 'meeting', status: 'done' },
    { date: '2026-11-03', title: '클라이언트 PPM', kind: 'meeting', status: 'done' },
    { date: '2026-11-04', title: '클라이언트 FB · 발주', kind: 'feedback', status: 'done' },
    { date: '2026-11-09', title: '에이전시 PD 미팅', kind: 'meeting', status: 'done' },
    { date: '2026-11-11', title: '스타일프레임 전달 (에이전시 검토)', kind: 'review', status: 'confirmed', note: '15시 목표 · 스틸 1장을 5초 HDR 영상(MP4)으로 · HDR 색 작업 전 상태로 전달' },
    { date: '2026-11-12', title: '클라이언트 실무 전달 · FB', kind: 'feedback', status: 'confirmed' },
    { date: '2026-11-13', title: '스틸컷 클라이언트 보고', kind: 'review', status: 'confirmed' },
    { date: '2026-12-03', title: '1차 애니메틱', kind: 'review', status: 'tentative', note: '그레이스케일 + 일부 FHD 컬러' },
    { date: '2026-12-04', title: '클라이언트 FB', kind: 'feedback', status: 'tentative' },
    { date: '2026-12-17', end: '2026-12-18', title: '녹음', kind: 'internal', status: 'tentative' },
    { date: '2026-12-21', title: '1차 시사 4K', kind: 'review', status: 'tentative', note: '화질 작업 병행' },
    { date: '2026-12-22', title: '클라이언트 FB', kind: 'feedback', status: 'tentative' },
    { date: '2026-12-30', title: '최종 4K 납품', kind: 'delivery', status: 'tentative', note: '3840×2160 · 60fps · HDR10 · ProRes 4444 XQ' },
    { date: '2026-12-30', end: '2026-12-31', title: '최종 화질검수', kind: 'qc', status: 'tentative' },
    { date: '2027-01-02', title: '현장 피딩', kind: 'delivery', status: 'tentative' },
    { date: '2027-01-04', end: '2027-01-08', title: '행사 상영', kind: 'internal', status: 'tentative' },
  ],

  // 작업 배정은 담당 범위가 정해지면 채운다.
  assignments: [],
};
