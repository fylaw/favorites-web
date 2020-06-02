package com.favorites.domain.enums;

public enum CollectCategory implements IEnum<CollectCategory> {
	PAGE("page", "页面"),
	TEXT("text", "文本"),
	IMG("img", "图片");

	private String code;
	private String name;
	
	CollectCategory(String code, String name) {
		this.code = code;
		this.name = name;
	}

	public String getCode() {
		return code;
	}

	public void setCode(String code) {
		this.code = code;
	}

	public String getName() {
		return name;
	}

	public void setName(String name) {
		this.name = name;
	}
	
	public CollectCategory[] datas() {
		return CollectCategory.values();
	}
}
