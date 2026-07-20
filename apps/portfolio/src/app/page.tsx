/**
 * 홈 화면의 섹션 순서와 시맨틱 구조만 담당하는 서버 컴포넌트다.
 * 반복 콘텐츠는 data/home 모듈에 위임해 항목 추가가 JSX 구조 변경으로
 * 이어지지 않도록 데이터 기반 렌더링(OCP) 경계를 유지한다.
 */
import Link from "next/link";
import Footer from "../components/Footer";
import Header from "../components/Header";
import { focusAreas, portfolioPaths } from "../data/home";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <Header />

      <main>
        <section className={`${styles.hero} ${styles.shell}`} aria-labelledby="hero-title">
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>SOFTWARE ENGINEER · SYSTEMS THINKER</p>
            <h1 id="hero-title" className={styles.heroTitle}>
              성능의 한계를 이해하고,{" "}
              <br />
              복잡한 문제를 끝까지 해결합니다.
            </h1>
            <p className={styles.heroDescription}>
              안녕하세요, SW Song입니다. 하드웨어를 직접 벤치마킹하던 호기심에서
              출발해 전체 컴퓨팅 스택의 원리를 탐구하고, 그 이해를 실제 제품과
              최적화로 연결하는 소프트웨어 엔지니어입니다.
            </p>
            <div className={styles.heroActions}>
              <Link className={styles.primaryAction} href="/about-me/resume">
                이력서 보기
                <span aria-hidden="true">↗</span>
              </Link>
              <Link className={styles.secondaryAction} href="/about-me/research">
                연구 경험 살펴보기
                <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>

          <aside className={styles.heroPanel} aria-label="핵심 관심 영역">
            <div className={styles.panelTop}>
              <span>CURRENT FOCUS</span>
              <span className={styles.status}>
                <span className={styles.statusDot} aria-hidden="true" />
                SYSTEMS &amp; AI
              </span>
            </div>
            <p className={styles.panelStatement}>
              더 적은 자원으로
              <br />
              더 단단한 시스템을.
            </p>
            <dl className={styles.signalList}>
              <div>
                <dt>Depth</dt>
                <dd>Hardware → Product</dd>
              </div>
              <div>
                <dt>Method</dt>
                <dd>Measure → Improve</dd>
              </div>
              <div>
                <dt>Partner</dt>
                <dd>Human × AI Agents</dd>
              </div>
            </dl>
          </aside>
        </section>

        <section id="about" className={`${styles.section} ${styles.shell}`}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionLabel}>ABOUT</p>
            <h2>원리를 파고들고, 결과로 증명합니다.</h2>
          </div>
          <div className={styles.aboutGrid}>
            <p className={styles.aboutLead}>
              제 관심사는 늘 “왜 느린가”, “어디까지 줄일 수 있는가”, 그리고
              “어떻게 다시 발생하지 않게 할 것인가”에 닿아 있습니다.
            </p>
            <div className={styles.aboutBody}>
              <p>
                오버클럭과 RAID 0 실험으로 시작한 성능 탐구는 CPU 명령어,
                메모리, 직렬화, 네트워크 대역폭을 거쳐 제품 전체를 바라보는
                관점으로 확장됐습니다.
              </p>
              <p>
                새로운 도구를 빠르게 익히되 결과를 그대로 믿지 않습니다.
                벤치마크와 재현 가능한 테스트로 확인하고, 기술적 선택을 읽을 수
                있는 기록으로 남깁니다.
              </p>
            </div>
          </div>
        </section>

        <section id="focus" className={`${styles.section} ${styles.shell}`}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionLabel}>FOCUS</p>
            <h2>제가 집중하는 세 가지 축</h2>
          </div>
          <div className={styles.focusGrid}>
            {focusAreas.map((area) => (
              <article className={styles.focusCard} key={area.index}>
                <span className={styles.cardIndex}>{area.index}</span>
                <h3>{area.title}</h3>
                <p>{area.description}</p>
                <ul aria-label={`${area.title} 키워드`}>
                  {area.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>

        <section id="research" className={`${styles.researchSection} ${styles.shell}`}>
          <div className={styles.researchCopy}>
            <p className={styles.sectionLabel}>RESEARCH NOTE</p>
            <h2>숫자로 확인할 수 있을 때까지 실험합니다.</h2>
            <p>
              CPU 벡터화, GPU 병렬 처리, 비트 패킹과 압축, 물리 계층별 전송
              병목을 직접 비교합니다. 성능 주장을 코드와 측정 결과로 설명하는
              것이 이 포트폴리오의 중심입니다.
            </p>
            <Link href="/about-me/research">
              전체 연구 노트 보기 <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className={styles.researchMatrix} aria-label="연구 범위">
            <span>SIMD</span>
            <span>AVX2</span>
            <span>CUDA</span>
            <span>BMI2</span>
            <span>ZSTD</span>
            <span>AGENTS</span>
          </div>
        </section>

        <section id="explore" className={`${styles.section} ${styles.shell}`}>
          <div className={styles.sectionHeader}>
            <p className={styles.sectionLabel}>EXPLORE</p>
            <h2>더 자세한 이야기</h2>
          </div>
          <div className={styles.pathGrid}>
            {portfolioPaths.map((path) => (
              <Link className={styles.pathCard} href={path.href} key={path.href}>
                <span className={styles.pathLabel}>{path.label}</span>
                <h3>{path.title}</h3>
                <p>{path.description}</p>
                <span className={styles.pathArrow} aria-hidden="true">
                  ↗
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className={`${styles.contact} ${styles.shell}`}>
          <p className={styles.sectionLabel}>CONTACT</p>
          <div>
            <h2>함께 풀어볼 문제가 있다면 이야기해 주세요.</h2>
            <a href="mailto:sworksong@gmail.com">sworksong@gmail.com ↗</a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
