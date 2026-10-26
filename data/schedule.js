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
  updated: '2026-10-26',
  source: '에이전시 일정표(10/18) 기준 · PPM 후 갱신 예정',
  range: { start: '2026-10-19', end: '2027-01-03' },

  milestones: [
    { date: '2026-10-26', title: '에이전시 미팅', kind: 'meeting', status: 'confirmed' },
    { date: '2026-10-26', end: '2026-10-27', title: '최종 PPM', kind: 'meeting', status: 'tentative' },
    { date: '2026-10-28', title: '클라이언트 FB · 발주 · 콘티 확정', kind: 'feedback', status: 'tentative' },
    { date: '2026-11-12', end: '2026-11-13', title: '스틸컷 스타일프레임', kind: 'review', status: 'tentative' },
    { date: '2026-11-16', title: '클라이언트 FB', kind: 'feedback', status: 'tentative' },
    { date: '2026-11-25', title: '1차 애니메틱', kind: 'review', status: 'tentative', note: '그레이스케일 + 일부 FHD 컬러' },
    { date: '2026-11-26', title: '클라이언트 FB', kind: 'feedback', status: 'tentative' },
    { date: '2026-12-15', title: '1차 시사 4K', kind: 'review', status: 'tentative', note: '화질 작업 병행' },
    { date: '2026-12-16', title: '클라이언트 FB', kind: 'feedback', status: 'tentative' },
    { date: '2026-12-22', title: '최종 영상 시사', kind: 'review', status: 'tentative' },
    { date: '2026-12-22', end: '2026-12-25', title: '1차 화질검수', kind: 'qc', status: 'tentative' },
    { date: '2026-12-23', title: '클라이언트 FB', kind: 'feedback', status: 'tentative' },
    { date: '2026-12-29', title: '최종 4K 납품', kind: 'delivery', status: 'tentative' },
    { date: '2026-12-29', end: '2027-01-01', title: '최종 화질검수', kind: 'qc', status: 'tentative' },
  ],

  // 작업 배정은 콘티 확정(10/28) 후 채운다.
  assignments: [],
};
