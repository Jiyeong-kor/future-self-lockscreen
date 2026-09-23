require 'xcodeproj'

# 일반 앱 스킴은 유지하고 런타임 검증 전용 타깃과 스킴만 등록한다.
def configure_runtime_tests(project_path)
  project = Xcodeproj::Project.open(project_path)
  app = project.targets.find { |target| target.name == 'FutureSelf' }
  raise 'FutureSelf app target is missing' unless app

  name = 'FutureSelfUITests'
  tests = project.targets.find { |target| target.name == name }
  if tests && tests.product_type != 'com.apple.product-type.bundle.ui-testing'
    raise 'Existing runtime test target has an unexpected product type'
  end
  deployment = app.build_configurations.first.build_settings.fetch('IPHONEOS_DEPLOYMENT_TARGET')
  tests ||= project.new_target(:ui_test_bundle, name, :ios, deployment, nil, :swift)
  tests.add_dependency(app) unless tests.dependencies.any? { |dependency| dependency.target == app }

  group = project.main_group.find_subpath(name, false) || project.main_group.new_group(name, name)
  file = 'PrivateStorageRuntimeTests.swift'
  source = group.files.find { |reference| reference.path == file } || group.new_file(file)
  unless tests.source_build_phase.files_references.include?(source)
    tests.source_build_phase.add_file_reference(source)
  end
  tests.build_configurations.each do |configuration|
    configuration.build_settings.merge!(
      'PRODUCT_BUNDLE_IDENTIFIER' => 'org.futureself.runtime-tests',
      'PRODUCT_NAME' => '$(TARGET_NAME)',
      'SWIFT_VERSION' => '5.0',
      'GENERATE_INFOPLIST_FILE' => 'YES',
      'TEST_TARGET_NAME' => app.name,
      'TARGETED_DEVICE_FAMILY' => '1,2',
      'IPHONEOS_DEPLOYMENT_TARGET' => deployment,
      'CODE_SIGN_STYLE' => 'Automatic'
    )
  end
  attributes = project.root_object.attributes['TargetAttributes'] ||= {}
  (attributes[tests.uuid] ||= {})['TestTargetID'] = app.uuid
  project.save

  scheme = Xcodeproj::XCScheme.new
  scheme.configure_with_targets(app, tests, launch_target: true)
  scheme.test_action.build_configuration = 'Release'
  scheme.save_as(project.path, 'FutureSelfRuntime', true)
end

if $PROGRAM_NAME == __FILE__
  configure_runtime_tests(ARGV.fetch(0, File.join(__dir__, 'FutureSelf.xcodeproj')))
end
