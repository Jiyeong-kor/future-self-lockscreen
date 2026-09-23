# pod install을 반복해도 같은 소스를 중복 등록하지 않는다.
def configure_private_storage(installer)
  projects = installer.aggregate_targets.map(&:user_project).compact.uniq
  configured = false
  projects.each do |project|
    target = project.targets.find { |item| item.name == 'FutureSelf' }
    next unless target

    group = project.main_group.find_subpath('FutureSelf', false)
    raise 'FutureSelf group is missing' unless group

    %w[RCTPrivateStorage.h RCTPrivateStorage.mm FutureSelf.entitlements].each do |name|
      path = "FutureSelf/#{name}"
      reference = group.files.find { |file| file.path == path } || group.new_file(path)
      if name.end_with?('.mm') && !target.source_build_phase.files_references.include?(reference)
        target.source_build_phase.add_file_reference(reference)
      end
    end
    target.build_configurations.each do |config|
      existing = config.build_settings['CODE_SIGN_ENTITLEMENTS']
      if existing && existing != 'FutureSelf/FutureSelf.entitlements'
        raise 'Review existing entitlements before changing private storage protection'
      end
      config.build_settings['CODE_SIGN_ENTITLEMENTS'] = 'FutureSelf/FutureSelf.entitlements'
    end
    project.save
    configured = true
  end
  raise 'FutureSelf target is missing' unless configured
end
