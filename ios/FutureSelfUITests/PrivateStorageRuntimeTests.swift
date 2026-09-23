import XCTest

// XCTest 전용 프로세스에서 실제 앱 UI와 저장소를 사용한다. 제품 코드에 대역을 주입하지 않는다.
final class PrivateStorageRuntimeTests: XCTestCase {
  override func setUpWithError() throws {
    continueAfterFailure = false
  }

  private func launchApp() -> XCUIApplication {
    let app = XCUIApplication()
    app.launchArguments += ["-AppleLanguages", "(ko)", "-AppleLocale", "ko_KR"]
    app.launch()
    XCTAssertTrue(app.wait(for: .runningForeground, timeout: 20))
    XCTAssertTrue(app.textViews["빠른 기록"].waitForExistence(timeout: 30))
    return app
  }

  private func enter(_ text: String, in app: XCUIApplication) {
    let input = app.textViews["빠른 기록"]
    XCTAssertTrue(input.waitForExistence(timeout: 10))
    input.tap()
    input.typeText(text)
    XCTAssertEqual(input.value as? String, text)
  }

  private func save(_ text: String, in app: XCUIApplication) {
    let button = app.buttons["기록 저장"]
    XCTAssertTrue(button.waitForExistence(timeout: 10))
    XCTAssertTrue(button.isEnabled)
    button.tap()
    XCTAssertTrue(app.staticTexts[text].firstMatch.waitForExistence(timeout: 20),
                  "실제 저장소에 저장한 기록이 홈에 표시되어야 합니다.")
    XCTAssertFalse(app.staticTexts["기록을 저장하지 못했습니다. 입력한 내용은 그대로 두었습니다."].exists)
  }

  func testSavedRecordSurvivesProcessRelaunch() {
    let app = launchApp()
    let text = "Runtime persistence " + UUID().uuidString
    enter(text, in: app)
    save(text, in: app)

    app.terminate()
    app.launch()
    XCTAssertTrue(app.textViews["빠른 기록"].waitForExistence(timeout: 30))
    XCTAssertTrue(app.staticTexts[text].firstMatch.waitForExistence(timeout: 20),
                  "프로세스 재시작 후에도 기존 키로 기록을 읽어야 합니다.")
  }

  func testBackgroundReturnPreservesDraftAndAllowsNewSave() {
    let app = launchApp()
    let saved = "Runtime before background " + UUID().uuidString
    let draft = "Runtime unsaved draft " + UUID().uuidString
    enter(saved, in: app)
    save(saved, in: app)
    enter(draft, in: app)

    XCUIDevice.shared.press(.home)
    XCTAssertTrue(app.wait(for: .runningBackground, timeout: 10))
    app.activate()
    XCTAssertTrue(app.wait(for: .runningForeground, timeout: 20))
    let input = app.textViews["빠른 기록"]
    XCTAssertTrue(input.waitForExistence(timeout: 10))
    XCTAssertEqual(input.value as? String, draft,
                   "백그라운드 전환은 작성 중인 생각을 지우지 않아야 합니다.")
    save(draft, in: app)
    XCTAssertEqual(app.staticTexts.matching(NSPredicate(format: "label == %@", draft)).count, 1,
                   "복귀 후 저장은 자동 재시도로 중복 생성되지 않아야 합니다.")
    XCTAssertTrue(app.staticTexts[saved].firstMatch.exists)
  }
}
