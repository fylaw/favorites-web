package com.favorites.domain;

import java.io.Serializable;

import javax.persistence.*;

import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 收藏夹
 * 
 * @author DingYS
 *
 */
@Data
@EqualsAndHashCode(callSuper = true)
@Entity
public class Favorites extends Entitys implements Serializable {

	private static final long serialVersionUID = 1L;
	@Id
	@GeneratedValue(strategy = GenerationType.IDENTITY)
	private Long id;
	
	@Column(nullable = false)
	private Long userId;
	
	@Column(nullable = false)
	private String name;
	
	@Column(nullable = false)
	private Long count;
	
	@Column(nullable = false)
	private Long createTime;
	
	@Column(nullable = false)
	private Long lastModifyTime;
	
	@Column(nullable = false)
	private Long publicCount;
	
	@Column(nullable = true) 
	private Long parentId;

	@Override
	public String toString() {
		return "Favorites{" + "id=" + id + ", userId=" + userId + ", name='" + name + '\'' + ", count=" + count
				+ ", createTime=" + createTime + ", lastModifyTime=" + lastModifyTime + ", publicCount=" + publicCount
				+ '}';
	}
}